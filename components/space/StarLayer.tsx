"use client";

import { useEffect, useRef } from "react";

/* Fine white starfield on pure black — the deep-space backdrop. Canvas-2D,
   DPR-aware. Two parallax depths drift slowly and lean toward the pointer, so
   the void feels alive without motion noise. Static on reduced-motion. */
export function StarLayer({ density = 0.00022 }: { density?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0,
      h = 0;
    type Star = { x: number; y: number; r: number; b: number; depth: number; seed: number };
    let stars: Star[] = [];

    const rand = (() => {
      let s = 1337;
      return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    })();

    const build = () => {
      const n = Math.round(w * h * density);
      stars = Array.from({ length: n }, () => {
        const depth = rand() < 0.78 ? 1 : 2; // most far, some near
        return {
          x: rand() * w,
          y: rand() * h,
          r: (depth === 2 ? 0.7 : 0.4) + rand() * (depth === 2 ? 1.1 : 0.7),
          b: 0.25 + rand() * 0.75,
          depth,
          seed: rand() * 6.283,
        };
      });
    };

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    if (!reduce) window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0;
    const draw = (t: number) => {
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const px = mouse.x * (s.depth === 2 ? 14 : 5);
        const py = mouse.y * (s.depth === 2 ? 14 : 5);
        const tw = reduce ? 1 : 0.7 + 0.3 * Math.sin(t * 0.0012 + s.seed);
        ctx.globalAlpha = Math.min(1, s.b * tw);
        ctx.beginPath();
        ctx.fillStyle = "#fff";
        ctx.arc(s.x + px, s.y + py, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    if (reduce) draw(0);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [density]);

  return <canvas ref={canvasRef} className="bhx-stars" aria-hidden="true" />;
}
