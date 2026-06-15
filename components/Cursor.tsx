"use client";

import { useEffect, useRef } from "react";

/* Custom cursor: dot + lagging ring. Over a [data-cursor] element a labelled
   pill ("view" / "open") fades in and the ring hides. */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dot = dotRef.current!;
    const ring = ringRef.current!;
    const labelEl = labelRef.current!;
    document.documentElement.classList.add("has-cursor");

    let mx = -100, my = -100, rx = -100, ry = -100, hot = false, label = "", last = "", raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      const t = e.target instanceof Element ? e.target : null;
      const labelled = t?.closest("[data-cursor]");
      label = labelled ? labelled.getAttribute("data-cursor") || "" : "";
      hot = label ? true : !!t?.closest("a, button, [data-hover]");
    };
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      const scale = label ? 0.2 : hot ? 2.4 : 1;
      ring.style.transform = `translate(${rx}px, ${ry}px) scale(${scale})`;
      ring.style.opacity = label ? "0" : hot ? "0.55" : "1";
      labelEl.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      if (label !== last) {
        labelEl.textContent = label;
        labelEl.style.opacity = label ? "1" : "0";
        last = label;
      }
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
      <div ref={labelRef} className="cursor-label" aria-hidden="true" />
    </>
  );
}
