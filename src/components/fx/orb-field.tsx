"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type OrbTone = "violet" | "sky" | "amber" | "rose" | "mint" | "slate";

export type Orb = {
  key: string;
  label: string;
  caption: string;
  /** 0..1 relative size */
  size: number;
  tone: OrbTone;
  /** One ring per milestone/capability; `lit` = done/paid/active. */
  rings: { lit: boolean }[];
  /** Small bodies orbiting this orb (e.g. pending change orders). */
  satellites?: { label: string }[];
  /** Lines shown in the hover card. */
  details?: string[];
  href?: string;
};

const TONE: Record<OrbTone, string> = {
  violet: "#8f82f0",
  sky: "#5f9fe8",
  amber: "#e0a33e",
  rose: "#e0708e",
  mint: "#4fbf87",
  slate: "#8a879a",
};

type Hover = { x: number; y: number; orb: Orb } | null;

/**
 * VowGraph orb field (three.js).
 *
 * Each orb is a physically-based glass sphere. Rings inside it encode real records (milestones,
 * capabilities), lit when complete. Satellites orbit an orb (pending change orders). With `links`,
 * orbs are joined by light paths carrying packets. Lighting is rim + environment reflections,
 * with no bloom or emissive neon.
 *
 * Hover shows a detail card; click navigates to `href`. A hidden list mirrors the data for
 * screen readers. Rendered on a dark stage in both themes on purpose (glass reads best on dark).
 */
export function OrbField({ orbs, height = 320, links = false, ariaLabel }: { orbs: Orb[]; height?: number; links?: boolean; ariaLabel: string }) {
  const host = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [hover, setHover] = useState<Hover>(null);
  const [ready, setReady] = useState(false);
  const dataKey = JSON.stringify(orbs);

  useEffect(() => {
    const el = host.current;
    if (!el || orbs.length === 0) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js");
      const { CSS2DRenderer, CSS2DObject } = await import("three/addons/renderers/CSS2DRenderer.js");
      if (disposed) return;
      const data: Orb[] = JSON.parse(dataKey);

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.style.display = "block";
      renderer.domElement.setAttribute("aria-hidden", "true");
      el.appendChild(renderer.domElement);

      const labels = new CSS2DRenderer();
      Object.assign(labels.domElement.style, { position: "absolute", inset: "0", pointerEvents: "none" });
      el.appendChild(labels.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;
      scene.environmentIntensity = 0.3;

      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

      // rim lights give the glass its edges (cool from back-left, warm from back-right)
      const rimA = new THREE.DirectionalLight(0x8f9bff, 2.2);
      rimA.position.set(-6, 3, -5);
      const rimB = new THREE.DirectionalLight(0xffc9a8, 1.1);
      rimB.position.set(6, 2, -4);
      const keyL = new THREE.DirectionalLight(0xffffff, 0.9);
      keyL.position.set(2, 6, 8);
      scene.add(rimA, rimB, keyL, new THREE.AmbientLight(0xffffff, 0.15));

      // soft contact shadow texture
      const sc = document.createElement("canvas");
      sc.width = sc.height = 128;
      const g = sc.getContext("2d")!;
      const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, "rgba(0,0,0,0.55)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, 128, 128);
      const shadowTex = new THREE.CanvasTexture(sc);

      const disposables: { dispose: () => void }[] = [envTex, pmrem, shadowTex];
      const track = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x);

      // layout: a gentle arc
      const n = data.length;
      const radii = data.map((o) => 0.62 + Math.max(0, Math.min(1, o.size)) * 0.5);
      const gap = 0.75;
      const totalW = radii.reduce((s, r) => s + r * 2, 0) + gap * (n - 1);
      let cursor = -totalW / 2;
      const centers = radii.map((r, i) => {
        const x = cursor + r;
        cursor += r * 2 + gap;
        const t = n > 1 ? i / (n - 1) : 0.5;
        return new THREE.Vector3(x, Math.sin(t * Math.PI) * 0.25, -Math.sin(t * Math.PI) * 0.6);
      });

      // all labels share one baseline under the lowest orb
      const floorY = Math.min(...centers.map((c, i) => c.y - radii[i])) - 0.5;

      type Body = {
        orb: Orb;
        group: import("three").Group;
        shell: import("three").Mesh;
        rings: import("three").Mesh[];
        sats: { mesh: import("three").Mesh; phase: number; radius: number; tilt: number }[];
        base: import("three").Vector3;
        r: number;
        phase: number;
        scale: number;
      };
      const bodies: Body[] = [];

      data.forEach((orb, i) => {
        const r = radii[i];
        const color = new THREE.Color(TONE[orb.tone]);
        const group = new THREE.Group();
        group.position.copy(centers[i]);
        scene.add(group);

        const shell = new THREE.Mesh(
          track(new THREE.SphereGeometry(r, 72, 54)),
          track(
            new THREE.MeshPhysicalMaterial({
              color: color.clone().lerp(new THREE.Color("#ffffff"), 0.55),
              metalness: 0,
              roughness: 0.1,
              transmission: 1,
              thickness: r * 1.6,
              ior: 1.45,
              attenuationColor: color,
              attenuationDistance: r * 2.2,
              clearcoat: 1,
              clearcoatRoughness: 0.25,
              specularIntensity: 1,
              transparent: true,
            }),
          ),
        );
        shell.userData.index = i;
        group.add(shell);

        // inner rings: one per record, tilted; lit = complete
        const ringMeshes: import("three").Mesh[] = [];
        const count = Math.max(1, orb.rings.length);
        orb.rings.forEach((ring, k) => {
          const rr = r * (0.42 + (0.4 * (k + 1)) / (count + 1));
          const mat = track(
            new THREE.MeshStandardMaterial({
              color: ring.lit ? color.clone().lerp(new THREE.Color("#ffffff"), 0.45) : new THREE.Color("#d6d3e6"),
              emissive: color,
              emissiveIntensity: ring.lit ? 0.9 : 0.18,
              roughness: 0.35,
              metalness: 0.1,
              // must stay opaque: transmissive glass only refracts opaque objects
            }),
          );
          const m = new THREE.Mesh(track(new THREE.TorusGeometry(rr, ring.lit ? 0.026 : 0.016, 12, 160)), mat);
          m.rotation.set(Math.PI / 2 + (k - count / 2) * 0.55, k * 0.9, k * 0.35);
          group.add(m);
          ringMeshes.push(m);
        });

        // core
        const core = new THREE.Mesh(
          track(new THREE.SphereGeometry(r * 0.12, 24, 16)),
          track(new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.4 })),
        );
        group.add(core);

        // contact shadow
        const sh = new THREE.Mesh(track(new THREE.PlaneGeometry(r * 2.6, r * 2.6)), track(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })));
        sh.rotation.x = -Math.PI / 2;
        sh.position.set(centers[i].x, centers[i].y - r - 0.18, centers[i].z);
        scene.add(sh);

        // satellites
        const sats = (orb.satellites ?? []).map((_, s) => {
          const mesh = new THREE.Mesh(
            track(new THREE.SphereGeometry(0.17, 32, 24)),
            track(
              new THREE.MeshPhysicalMaterial({
                color: new THREE.Color(TONE.amber).lerp(new THREE.Color("#ffffff"), 0.4),
                roughness: 0.1,
                transmission: 0.9,
                thickness: 0.3,
                clearcoat: 1,
                emissive: new THREE.Color(TONE.amber),
                emissiveIntensity: 0.25,
              }),
            ),
          );
          scene.add(mesh);
          return { mesh, phase: (s / Math.max(1, orb.satellites!.length)) * Math.PI * 2, radius: r + 0.38, tilt: 0.35 };
        });

        // label
        const div = document.createElement("div");
        div.className = "pp-orb-label";
        const t = document.createElement("div");
        t.className = "pp-orb-title";
        t.textContent = orb.label;
        const c = document.createElement("div");
        c.className = "pp-orb-caption";
        c.textContent = orb.caption;
        div.append(t, c);
        const lbl = new CSS2DObject(div);
        lbl.position.set(0, floorY - centers[i].y, 0);
        group.add(lbl);

        bodies.push({ orb, group, shell, rings: ringMeshes, sats, base: centers[i].clone(), r, phase: i * 1.3, scale: 1 });
      });

      // links with packets
      const packets: { mesh: import("three").Mesh; curve: import("three").CatmullRomCurve3; t: number }[] = [];
      if (links && n > 1) {
        const linkMat = track(new THREE.MeshBasicMaterial({ color: 0x8f82f0, transparent: true, opacity: 0.28 }));
        const packetMat = track(new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x8f82f0, emissiveIntensity: 0.6 }));
        for (let i = 0; i < n - 1; i++) {
          const a = centers[i].clone().add(new THREE.Vector3(radii[i] * 0.98, 0, 0));
          const b = centers[i + 1].clone().add(new THREE.Vector3(-radii[i + 1] * 0.98, 0, 0));
          const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, -0.22, 0.25));
          const curve = new THREE.CatmullRomCurve3([a, mid, b]);
          scene.add(new THREE.Mesh(track(new THREE.TubeGeometry(curve, 40, 0.012, 8, false)), linkMat));
          for (let k = 0; k < 2; k++) {
            const p = new THREE.Mesh(track(new THREE.SphereGeometry(0.045, 12, 10)), packetMat);
            scene.add(p);
            packets.push({ mesh: p, curve, t: k / 2 });
          }
        }
      }

      // camera fit (horizontal)
      const fit = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        renderer.setSize(w, h, false);
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        labels.setSize(w, h);
        camera.aspect = w / Math.max(1, h);
        const vfov = (camera.fov * Math.PI) / 180;
        const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
        const halfW = totalW / 2 + 0.9;
        const maxR = Math.max(...radii);
        const zW = halfW / Math.tan(hfov / 2);
        const zH = (maxR + 1.25) / Math.tan(vfov / 2);
        camera.position.set(0, 0.55, Math.max(zW, zH));
        camera.lookAt(0, -0.15, 0);
        camera.updateProjectionMatrix();
      };
      fit();
      const ro = new ResizeObserver(fit);
      ro.observe(el);
      const baseCam = camera.position.clone();

      // pointer: parallax + hover + click
      const ray = new THREE.Raycaster();
      const ptr = new THREE.Vector2(9, 9);
      let par = 0;
      let parT = 0;
      let hovered = -1;
      const rect = () => renderer.domElement.getBoundingClientRect();
      const onMove = (e: PointerEvent) => {
        const r = rect();
        ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        parT = ptr.x;
      };
      const onLeave = () => {
        ptr.set(9, 9);
        parT = 0;
      };
      const onClick = () => {
        if (hovered >= 0 && bodies[hovered].orb.href) router.push(bodies[hovered].orb.href!);
      };
      renderer.domElement.addEventListener("pointermove", onMove);
      renderer.domElement.addEventListener("pointerleave", onLeave);
      renderer.domElement.addEventListener("click", onClick);

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const clock = new THREE.Clock();
      const v = new THREE.Vector3();
      let raf = 0;
      let lastHover = -2;

      const tick = () => {
        const dt = Math.min(0.05, clock.getDelta());
        const time = reduced ? 0 : clock.elapsedTime;

        ray.setFromCamera(ptr, camera);
        const hit = ray.intersectObjects(bodies.map((b) => b.shell), false)[0];
        hovered = hit ? (hit.object.userData.index as number) : -1;
        renderer.domElement.style.cursor = hovered >= 0 && bodies[hovered].orb.href ? "pointer" : "default";

        bodies.forEach((b, i) => {
          b.group.position.set(b.base.x, b.base.y + Math.sin(time * 0.8 + b.phase) * 0.06, b.base.z);
          const target = i === hovered ? 1.07 : 1;
          b.scale += (target - b.scale) * 0.12;
          b.group.scale.setScalar(b.scale);
          b.rings.forEach((m, k) => {
            m.rotation.z += dt * (0.12 + k * 0.05) * (k % 2 ? -1 : 1) * (reduced ? 0 : 1);
          });
          b.sats.forEach((s) => {
            const a = s.phase + time * 0.7;
            s.mesh.position.set(
              b.group.position.x + Math.cos(a) * s.radius * b.scale,
              b.group.position.y + Math.sin(a) * s.radius * s.tilt * b.scale,
              b.group.position.z + Math.sin(a) * s.radius * b.scale,
            );
          });
        });

        for (const p of packets) {
          if (!reduced) p.t = (p.t + dt * 0.35) % 1;
          p.mesh.position.copy(p.curve.getPointAt(p.t));
        }

        par += (parT - par) * 0.05;
        camera.position.set(baseCam.x + par * 0.6, baseCam.y, baseCam.z);
        camera.lookAt(0, -0.15, 0);

        if (hovered !== lastHover) {
          lastHover = hovered;
          if (hovered < 0) setHover(null);
        }
        if (hovered >= 0) {
          const b = bodies[hovered];
          v.copy(b.group.position).add(new THREE.Vector3(0, b.r * b.scale, 0)).project(camera);
          setHover({ x: ((v.x + 1) / 2) * el.clientWidth, y: ((1 - v.y) / 2) * el.clientHeight, orb: b.orb });
        }

        renderer.render(scene, camera);
        labels.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      const start = () => {
        cancelAnimationFrame(raf);
        clock.getDelta();
        raf = requestAnimationFrame(tick);
      };
      const onVis = () => (document.hidden ? cancelAnimationFrame(raf) : start());
      document.addEventListener("visibilitychange", onVis);
      start();
      setReady(true);
      el.dataset.ready = "1";

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        document.removeEventListener("visibilitychange", onVis);
        renderer.domElement.removeEventListener("pointermove", onMove);
        renderer.domElement.removeEventListener("pointerleave", onLeave);
        renderer.domElement.removeEventListener("click", onClick);
        disposables.forEach((d) => d.dispose());
        renderer.dispose();
        renderer.domElement.remove();
        labels.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [dataKey, links, orbs.length, router]);

  return (
    <figure className="pp-orb-stage relative m-0 overflow-hidden" style={{ height }}>
      {orbs.length === 0 ? (
        <div className="grid h-full place-items-center px-6 text-center text-sm text-[#9a98a6]">Commitments appear here once a client accepts a proposal.</div>
      ) : (
        <div ref={host} className="absolute inset-0" role="img" aria-label={ariaLabel} />
      )}
      {!ready && orbs.length > 0 && <div className="pointer-events-none absolute inset-0 grid place-items-center text-xs text-[#615f6c]">Loading 3D view…</div>}
      {hover && hover.orb.details && (
        <div
          className="pointer-events-none absolute z-10 w-56 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-xl border border-white/10 bg-[#17161d]/95 p-3 text-left text-[0.75rem] text-[#ecebf0] shadow-[0_12px_32px_-12px_rgb(0_0_0/0.6)] backdrop-blur"
          style={{ left: hover.x, top: hover.y }}
        >
          <p className="font-semibold">{hover.orb.label}</p>
          <ul className="mt-1.5 space-y-0.5 text-[#b4b2c0]">
            {hover.orb.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          {hover.orb.href && <p className="mt-2 text-[0.7rem] text-[#a79cf5]">Click to open</p>}
        </div>
      )}
      <figcaption className="sr-only">
        <ul>
          {orbs.map((o) => (
            <li key={o.key}>
              {o.label}: {o.caption}. {o.details?.join(". ")}
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
