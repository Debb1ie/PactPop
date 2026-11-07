"use client";

import { useEffect, useRef } from "react";

/**
 * 3D perspective grid that reacts to scrolling.
 *
 * - Scrolling down pushes the floor toward the viewer; scrolling up pulls it back
 *   (smoothed scroll velocity drives the travel).
 * - Page scroll progress raises the horizon, so the "camera" tilts as you move down the page.
 * - The vanishing point drifts toward the pointer for subtle parallax.
 * - A slow idle drift keeps it alive when you stop scrolling.
 *
 * Canvas 2D, one rAF loop, paused when the tab is hidden, DPR-aware, and fully static under
 * prefers-reduced-motion.
 */
export function ScrollGrid({ intensity = 1 }: { intensity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;

    // theme-dependent colours, refreshed when <html class> changes
    let line = "123,109,255";
    let glow = "108,92,255";
    let alphaBase = 0.42;
    const readTheme = () => {
      const dark = document.documentElement.classList.contains("dark");
      line = dark ? "139,123,255" : "91,76,245";
      glow = dark ? "108,92,255" : "120,104,255";
      alphaBase = (dark ? 0.42 : 0.26) * intensity;
    };
    readTheme();
    const mo = new MutationObserver(readTheme);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // motion state
    let offset = 0; // world-units travelled along z
    let velocity = 0; // smoothed scroll contribution
    let lastScroll = window.scrollY;
    let mouseX = 0.5;
    let vpX = 0.5;
    let horizonT = 0;
    let last = performance.now();
    let raf = 0;

    const onPointer = (e: PointerEvent) => {
      mouseX = e.clientX / Math.max(1, w);
    };

    const Z_NEAR = 0.35;
    const Z_FAR = 34;
    const HALF_WIDTH = 30;

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const sy = window.scrollY;
      const dy = sy - lastScroll;
      lastScroll = sy;
      const max = Math.max(1, document.documentElement.scrollHeight - h);
      const progress = Math.min(1, Math.max(0, sy / max));

      if (!reduced) {
        velocity += (dy * 0.012 - velocity) * 0.12; // ease toward current scroll speed
        offset += dt * 0.35 + velocity; // idle drift + scroll-driven travel
        vpX += (0.5 + (mouseX - 0.5) * 0.18 - vpX) * 0.05;
        horizonT += (progress - horizonT) * 0.08;
      }

      const horizon = h * (0.56 - horizonT * 0.24); // camera tilts as you scroll down
      const vx = w * vpX;
      const f = h * 0.95; // focal length
      const camH = 1 + Math.min(0.6, Math.abs(velocity) * 0.25); // slight lift on fast scroll

      ctx.clearRect(0, 0, w, h);

      // horizon glow
      const g = ctx.createRadialGradient(vx, horizon, 0, vx, horizon, Math.max(w, h) * 0.55);
      g.addColorStop(0, `rgba(${glow},${0.28 * intensity})`);
      g.addColorStop(1, `rgba(${glow},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.lineWidth = 1;

      // depth lines (parallel to the horizon), scrolling along z
      const frac = ((offset % 1) + 1) % 1;
      for (let i = 0; i < Z_FAR; i++) {
        const z = Z_NEAR + i + 1 - frac;
        if (z <= Z_NEAR) continue;
        const y = horizon + (f * camH) / z;
        if (y > h + 2) continue;
        const a = alphaBase * Math.pow(1 - Math.min(1, z / Z_FAR), 1.6);
        if (a < 0.004) continue;
        ctx.strokeStyle = `rgba(${line},${a})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // longitudinal lines converging to the vanishing point
      // Start each line where the floor meets the bottom edge of the screen, so the fade
      // happens on-screen (starting at Z_NEAR put most of the gradient below the viewport).
      const zStart = Math.max(Z_NEAR, (f * camH) / Math.max(1, h - horizon));
      const yNear = horizon + (f * camH) / zStart;
      const yFar = horizon + (f * camH) / Z_FAR;
      for (let x = -HALF_WIDTH; x <= HALF_WIDTH; x++) {
        const xNear = vx + (f * x) / zStart;
        const xFar = vx + (f * x) / Z_FAR;
        if ((xNear < -w && xFar < 0) || (xNear > 2 * w && xFar > w)) continue;
        const grad = ctx.createLinearGradient(0, yNear, 0, yFar);
        const a = alphaBase * 1.15 * (1 - Math.min(1, Math.abs(x) / HALF_WIDTH) * 0.5);
        grad.addColorStop(0, `rgba(${line},${a})`);
        grad.addColorStop(1, `rgba(${line},0)`);
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(xNear, yNear);
        ctx.lineTo(xFar, yFar);
        ctx.stroke();
      }

      // glowing nodes travelling along the centre lanes
      for (let k = -2; k <= 2; k++) {
        const z = Z_NEAR + ((((offset * 1.6 + k * 7.3) % Z_FAR) + Z_FAR) % Z_FAR);
        if (z < 0.6) continue;
        const px = vx + (f * k * 2) / z;
        const py = horizon + (f * camH) / z;
        if (py > h) continue;
        const r = Math.max(1, 5 / z);
        const a = Math.min(1, 2.2 / z) * alphaBase * 1.8;
        ctx.fillStyle = `rgba(${line},${a})`;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(draw);
    };
    const onVisibility = () => (document.hidden ? cancelAnimationFrame(raf) : start());
    const onResize = () => {
      resize();
      if (reduced) requestAnimationFrame(draw);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intensity]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />;
}
