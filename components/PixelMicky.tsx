"use client";

import { useEffect, useRef } from "react";

const SHEET = "/sprites/micky-keyed.png";
const COLS = 4, ROWS = 2;
// walk cycle alternates sheet frames 1 and 2 (row 0); fire pose is frame 7 (row 1, col 3)
const WALK = [1, 2];
const FIRE = 7;

/* The brand character: pixel Micky patrols a baseline. Click him: he shoots. */
export function PixelMicky({ height = 64 }: { height?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const spriteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wrap = wrapRef.current!;
    const sprite = spriteRef.current!;
    const w = height * 1.5;
    let x = 20, dir = 1, frame = 0, frameClock = 0, firing = 0, raf = 0, last = performance.now();

    const setFrame = (f: number) => {
      const col = f % COLS, row = Math.floor(f / COLS);
      sprite.style.backgroundPosition = `${(col / (COLS - 1)) * 100}% ${row * 100}%`;
    };
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const max = wrap.clientWidth - w - 8;
      if (firing > 0) {
        firing -= dt;
        setFrame(FIRE);
      } else {
        x += dir * 38 * dt;
        if (x > max) { x = max; dir = -1; }
        if (x < 8) { x = 8; dir = 1; }
        frameClock += dt;
        if (frameClock > 0.22) { frameClock = 0; frame = (frame + 1) % WALK.length; }
        setFrame(WALK[frame]);
      }
      sprite.style.transform = `translateX(${x}px) scaleX(${dir})`;
      raf = requestAnimationFrame(loop);
    };

    const fire = () => { firing = 0.45; };
    sprite.addEventListener("click", fire);
    if (!reduce) raf = requestAnimationFrame(loop);
    else { setFrame(0); sprite.style.transform = `translateX(24px)`; }
    return () => { cancelAnimationFrame(raf); sprite.removeEventListener("click", fire); };
  }, [height]);

  return (
    <div ref={wrapRef} className="pixel-walk" style={{ height }} title="click him">
      <div
        ref={spriteRef}
        className="pixel-walk__sprite"
        data-hover
        style={{
          width: height * 1.5,
          height,
          backgroundImage: `url(${SHEET})`,
          backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
        }}
      />
    </div>
  );
}
