"use client";

import { useEffect, useRef } from "react";

/**
 * Real-time 3D grid terrain (WebGL / three.js).
 *
 * A wireframe-style grid is drawn in a fragment shader over a displaced plane mesh, so lines
 * follow the surface in true perspective and stay anti-aliased at any distance.
 *
 * Scroll interaction
 * - scroll velocity → the camera flies forward/backward over the terrain
 * - scroll velocity → waves swell, then settle when scrolling stops
 * - page progress   → the camera descends and pitches toward the horizon
 * - pointer         → gentle camera parallax
 *
 * three.js is loaded lazily after mount so it never blocks first paint. The loop pauses on hidden
 * tabs, renders one still frame under prefers-reduced-motion, and renders nothing without WebGL.
 */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uTravel;
  uniform float uAmp;
  varying vec3 vGrid;
  varying vec3 vWorld;
  varying float vH;

  float terrain(vec2 p) {
    float h = sin(p.x * 0.17 + uTime * 0.33) * cos(p.y * 0.15 - uTime * 0.21);
    h += 0.75 * sin((p.x * 0.55 + p.y) * 0.085 + uTime * 0.18);
    h += 0.55 * cos(p.x * 0.045 - p.y * 0.065);
    // open a shallow valley down the middle so the camera glides through a channel
    h *= 0.25 + 0.75 * smoothstep(1.5, 16.0, abs(p.x));
    return h * uAmp;
  }

  void main() {
    vec3 pos = position;
    vec2 p = vec2(pos.x, pos.z - uTravel);
    float h = terrain(p);
    pos.y += h;
    vH = h;
    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorld = world.xyz;
    vGrid = vec3(world.x, world.y, world.z - uTravel);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uLow;
  uniform vec3 uMid;
  uniform vec3 uHigh;
  uniform float uOpacity;
  uniform vec3 uCamera;
  varying vec3 vGrid;
  varying vec3 vWorld;
  varying float vH;

  float gridLine(vec2 coord, float width) {
    vec2 g = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
    return 1.0 - min(min(g.x, g.y) / width, 1.0);
  }

  void main() {
    float major = gridLine(vGrid.xz / 2.0, 1.0);
    float minor = gridLine(vGrid.xz / 0.5, 0.6) * 0.18;
    float line = max(major, minor);

    float dist = distance(vWorld.xz, uCamera.xz);
    float fog = 1.0 - smoothstep(14.0, 70.0, dist);
    float near = smoothstep(0.5, 5.0, dist);          // avoid harsh lines right under the camera

    float crest = smoothstep(0.15, 1.6, vH);
    vec3 col = mix(uLow, uMid, smoothstep(-1.4, 0.8, vH));
    col = mix(col, uHigh, crest * 0.7);

    float a = line * (0.45 + crest * 0.9);
    a += 0.03 * (0.4 + crest);                         // faint surface sheen for volume
    a *= fog * near * uOpacity;
    if (a < 0.002) discard;
    gl_FragColor = vec4(col, a);
  }
`;

type Palette = { low: string; mid: string; high: string; opacity: number; additive: boolean };
// Matte, low-contrast lines (no additive blending or glow).
const DARK: Palette = { low: "#34313f", mid: "#4d4960", high: "#7c72c8", opacity: 0.75, additive: false };
const LIGHT: Palette = { low: "#c9c7d8", mid: "#aeaac6", high: "#7a6fd0", opacity: 0.6, additive: false };

export function ScrollGrid({ intensity = 1 }: { intensity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
      } catch {
        return; // no WebGL → no background effect, page still works
      }
      renderer.setClearColor(0x000000, 0);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 200);

      const geometry = new THREE.PlaneGeometry(150, 130, 240, 210);
      geometry.rotateX(-Math.PI / 2);
      geometry.translate(0, 0, -55);

      const uniforms = {
        uTime: { value: 0 },
        uTravel: { value: 0 },
        uAmp: { value: 1 },
        uLow: { value: new THREE.Color() },
        uMid: { value: new THREE.Color() },
        uHigh: { value: new THREE.Color() },
        uOpacity: { value: 1 },
        uCamera: { value: new THREE.Vector3() },
      };
      const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      scene.add(new THREE.Mesh(geometry, material));

      const applyTheme = () => {
        const p = document.documentElement.classList.contains("dark") ? DARK : LIGHT;
        uniforms.uLow.value.set(p.low);
        uniforms.uMid.value.set(p.mid);
        uniforms.uHigh.value.set(p.high);
        uniforms.uOpacity.value = p.opacity * intensity;
        material.blending = p.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
        material.needsUpdate = true;
      };
      applyTheme();
      const mo = new MutationObserver(applyTheme);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

      const resize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.fov = w < 640 ? 70 : 58;
        camera.updateProjectionMatrix();
      };
      resize();

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let lastScroll = window.scrollY;
      let velocity = 0;
      let travel = 0;
      let amp = 1;
      let progress = 0;
      let mx = 0;
      let my = 0;
      let pointerX = 0;
      let pointerY = 0;
      let raf = 0;
      let last = performance.now();
      const lookTarget = new THREE.Vector3();

      const onPointer = (e: PointerEvent) => {
        pointerX = (e.clientX / window.innerWidth) * 2 - 1;
        pointerY = (e.clientY / window.innerHeight) * 2 - 1;
      };

      const frame = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;

        const sy = window.scrollY;
        const dy = sy - lastScroll;
        lastScroll = sy;
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

        if (!reduced) {
          velocity += (dy - velocity) * 0.1; // px/frame, eased
          travel += dt * 1.1 + velocity * 0.045; // idle glide + scroll-driven flight
          amp += (1 + Math.min(Math.abs(velocity) * 0.035, 1.4) - amp) * 0.06; // waves swell with speed
          progress += (Math.min(1, sy / max) - progress) * 0.06;
          mx += (pointerX - mx) * 0.04;
          my += (pointerY - my) * 0.04;
          uniforms.uTime.value += dt;
        }

        // camera: descends and pitches toward the horizon as the page progresses
        camera.position.set(mx * 2.2, 5.2 - progress * 2.6 - my * 0.4, 9);
        lookTarget.set(mx * 3.5, 1.2 - progress * 1.2, -30);
        camera.lookAt(lookTarget);
        camera.rotation.z = -mx * 0.04 - velocity * 0.0008; // slight bank into the motion

        uniforms.uTravel.value = travel;
        uniforms.uAmp.value = amp;
        uniforms.uCamera.value.copy(camera.position);

        renderer.render(scene, camera);
        if (!reduced) raf = requestAnimationFrame(frame);
      };

      const start = () => {
        cancelAnimationFrame(raf);
        last = performance.now();
        raf = requestAnimationFrame(frame);
      };
      const onVisibility = () => (document.hidden ? cancelAnimationFrame(raf) : start());
      const onResize = () => {
        resize();
        if (reduced) requestAnimationFrame(frame);
      };

      window.addEventListener("resize", onResize);
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
      canvas.style.opacity = "1";
      start();

      cleanup = () => {
        cancelAnimationFrame(raf);
        mo.disconnect();
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointermove", onPointer);
        document.removeEventListener("visibilitychange", onVisibility);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [intensity]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{ opacity: 0 }}
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full transition-opacity duration-1000 [mask-image:linear-gradient(to_bottom,transparent_0%,black_38%,black_100%)]"
    />
  );
}
