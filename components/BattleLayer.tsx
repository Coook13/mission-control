"use client";

import { useEffect, useRef, useState } from "react";

const SHEET = "/sprites/micky-sprites.png";
const COLS = 4;
const ROWS = 2;
const AIM = 6; // aiming straight, row 2
const FIRE = 7; // muzzle-flash pose

const CYAN = "#34D2FF";
const AMBER = "#FFB020";

type Side = "left" | "right" | "top" | "bottom";

type Unit = {
  side: Side;
  fx: number; // base position as fraction of width
  fy: number;
  x: number;
  y: number;
  phase: number;
  bobSpd: number;
  drift: number; // fraction/sec, roamers only
  scale: number;
  face: 1 | -1;
  dead: number; // >0 = respawn countdown
  invuln: number;
  cool: number;
  flash: number;
  alpha: number;
};

type Bullet = { x: number; y: number; vx: number; vy: number; color: string; age: number; ghost?: boolean };
type Part = { x: number; y: number; vx: number; vy: number; s: number; color: string; life: number; max: number };

function keyWhite(img: HTMLImageElement) {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, c.width, c.height);
  const p = d.data;
  for (let i = 0; i < p.length; i += 4) {
    if (p[i] > 230 && p[i + 1] > 230 && p[i + 2] > 230) p[i + 3] = 0;
  }
  ctx.putImageData(d, 0, 0);
  return c;
}

function makeSquads(): Unit[] {
  const units: Unit[] = [];
  const mk = (side: Side, fx: number, fy: number, face: 1 | -1, drift = 0): Unit => ({
    side,
    fx,
    fy,
    x: 0,
    y: 0,
    phase: Math.random() * Math.PI * 2,
    bobSpd: 0.6 + Math.random() * 0.7,
    drift,
    scale: 0.78 + Math.random() * 0.44,
    face,
    dead: 0,
    invuln: 0,
    cool: Math.random() * 1.4,
    flash: 0,
    alpha: 1,
  });
  // left battle line (faces right)
  [0.2, 0.36, 0.52, 0.68, 0.84].forEach((fy, i) =>
    units.push(mk("left", 0.04 + (i % 2) * 0.09 + Math.random() * 0.015, fy + (Math.random() - 0.5) * 0.04, 1))
  );
  // right battle line (faces left)
  [0.22, 0.38, 0.54, 0.7, 0.86].forEach((fy, i) =>
    units.push(mk("right", 0.96 - (i % 2) * 0.09 - Math.random() * 0.015, fy + (Math.random() - 0.5) * 0.04, -1))
  );
  // roamers top + bottom
  units.push(mk("top", 0.3, 0.1, 1, 0.035 + Math.random() * 0.02));
  units.push(mk("top", 0.65, 0.16, -1, -(0.035 + Math.random() * 0.02)));
  units.push(mk("bottom", 0.4, 0.9, -1, -(0.03 + Math.random() * 0.02)));
  units.push(mk("bottom", 0.7, 0.84, 1, 0.03 + Math.random() * 0.02));
  return units;
}

export function BattleLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 760px)").matches;
    if (!reduce && !small) setOn(true);
  }, []);

  useEffect(() => {
    if (!on) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let sheet: HTMLCanvasElement | null = null;
    let fw = 0;
    let fh = 0;
    let W = 0;
    let H = 0;
    let dpr = 1;
    let raf = 0;
    let running = false;
    let visible = true;
    let frozen = false;
    let last = 0;
    let t = 0;
    let ambient = 0.4;

    const units = makeSquads();
    const bullets: Bullet[] = [];
    const parts: Part[] = [];

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const explode = (x: number, y: number, color: string) => {
      const colors = [color, "#FFFFFF", AMBER, "#FF6B57"];
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 40 + Math.random() * 220;
        parts.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 30,
          s: 2 + Math.random() * 4,
          color: colors[(Math.random() * colors.length) | 0],
          life: 0.55 + Math.random() * 0.3,
          max: 0.85,
        });
      }
    };

    const spawnBullet = (
      x: number,
      y: number,
      tx: number,
      ty: number,
      color: string,
      speed: number,
      ghost = false
    ) => {
      if (bullets.length > 110) return;
      const d = Math.hypot(tx - x, ty - y) || 1;
      const spread = (Math.random() - 0.5) * 0.09;
      const dx = (tx - x) / d;
      const dy = (ty - y) / d;
      const ca = Math.cos(spread);
      const sa = Math.sin(spread);
      bullets.push({ x, y, vx: (dx * ca - dy * sa) * speed, vy: (dx * sa + dy * ca) * speed, color, age: 0, ghost });
    };

    const step = (dt: number) => {
      t += dt;
      // ambient stray fire sweeping the screen — cosmetic war wash (never kills)
      ambient -= dt;
      if (ambient <= 0) {
        ambient = 0.07 + Math.random() * 0.2;
        const fromLeft = Math.random() < 0.5;
        if (Math.random() < 0.8) {
          const y = H * (0.06 + Math.random() * 0.88);
          spawnBullet(fromLeft ? -40 : W + 40, y, fromLeft ? W + 80 : -80, y + (Math.random() - 0.5) * H * 0.35, fromLeft ? CYAN : AMBER, 520 + Math.random() * 300, true);
        } else {
          const x = W * (0.12 + Math.random() * 0.76);
          const fromTop = Math.random() < 0.5;
          spawnBullet(x, fromTop ? -40 : H + 40, x + (Math.random() - 0.5) * W * 0.3, fromTop ? H + 80 : -80, fromLeft ? CYAN : AMBER, 480 + Math.random() * 240, true);
        }
      }

      for (const u of units) {
        if (u.dead > 0) {
          u.dead -= dt;
          if (u.dead <= 0) {
            u.fy = Math.min(0.92, Math.max(0.08, u.fy + (Math.random() - 0.5) * 0.1));
            u.invuln = 1.2;
            u.alpha = 0;
          }
          continue;
        }
        if (u.alpha < 1) u.alpha = Math.min(1, u.alpha + dt * 2.2);
        if (u.invuln > 0) u.invuln -= dt;
        if (u.drift !== 0) {
          u.fx += u.drift * dt;
          if (u.fx < 0.12 || u.fx > 0.88) {
            u.drift *= -1;
            u.face = (u.face * -1) as 1 | -1;
          }
        }
        u.x = u.fx * W + Math.sin(t * u.bobSpd + u.phase) * 12;
        u.y = u.fy * H + Math.sin(t * u.bobSpd * 0.8 + u.phase * 1.7) * 18;
        if (u.flash > 0) u.flash -= dt;
        u.cool -= dt;
        if (u.cool <= 0) {
          // FFA target: prefer the opposite wall, but anyone in the facing half-plane is fair game
          const all = units.filter((o) => o !== u && o.dead <= 0 && (o.x - u.x) * u.face > 60);
          if (all.length) {
            const opp = all.filter((o) => o.side !== u.side);
            const pool = opp.length && Math.random() < 0.75 ? opp : all;
            const tgt = pool[(Math.random() * pool.length) | 0];
            const h = 128 * u.scale;
            const w = (h * fw) / fh || h * 0.75;
            const mx = u.x + u.face * w * 0.46;
            const my = u.y - h * 0.02;
            u.flash = 0.16;
            u.cool = 0.45 + Math.random() * 0.95;
            spawnBullet(mx, my, tgt.x, tgt.y, u.side === "left" || u.side === "bottom" ? CYAN : AMBER, 560 + Math.random() * 200);
          } else {
            u.face = (u.face * -1) as 1 | -1;
            u.cool = 0.3;
          }
        }
      }

      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.age += dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        let dead = b.x < -90 || b.x > W + 90 || b.y < -90 || b.y > H + 90;
        if (!dead && !b.ghost && b.age > 0.07) {
          for (const u of units) {
            if (u.dead > 0 || u.invuln > 0 || u.alpha < 0.6) continue;
            const h = 128 * u.scale;
            const w = (h * fw) / fh || h * 0.75;
            if (Math.abs(b.x - u.x) < w * 0.28 && Math.abs(b.y - u.y) < h * 0.42) {
              explode(u.x, u.y, b.color);
              u.dead = 0.9 + Math.random() * 0.8;
              u.alpha = 0;
              dead = true;
              break;
            }
          }
        }
        if (dead) bullets.splice(i, 1);
      }

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= dt;
        if (p.life <= 0) {
          parts.splice(i, 1);
          continue;
        }
        p.vy += 220 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      if (!sheet) return;
      ctx.imageSmoothingEnabled = false;

      // units, back to front
      const sorted = [...units].sort((a, b) => a.scale - b.scale);
      for (const u of sorted) {
        if (u.dead > 0) continue;
        const h = 128 * u.scale;
        const w = (h * fw) / fh;
        const frame = u.flash > 0 ? FIRE : AIM;
        const sx = (frame % COLS) * fw;
        const sy = ((frame / COLS) | 0) * fh;
        const team = u.side === "left" || u.side === "bottom" ? CYAN : AMBER;
        let a = u.alpha * (0.88 + 0.12 * ((u.scale - 0.78) / 0.44));
        if (u.invuln > 0 && Math.sin(t * 26) < 0) a *= 0.55;
        ctx.globalAlpha = a;
        ctx.save();
        ctx.translate(u.x, u.y);
        if (u.face < 0) ctx.scale(-1, 1);
        // team-colored aura traced around the character silhouette
        ctx.shadowColor = team;
        ctx.shadowBlur = 18 * u.scale;
        ctx.filter = "brightness(1.45) saturate(1.15)";
        ctx.drawImage(sheet, sx, sy, fw, fh, -w / 2, -h / 2, w, h);
        ctx.shadowBlur = 0;
        ctx.filter = "none";
        ctx.restore();
        // muzzle flash glow
        if (u.flash > 0.06) {
          const mx = u.x + u.face * w * 0.46;
          const my = u.y - h * 0.02;
          ctx.globalCompositeOperation = "lighter";
          const g = ctx.createRadialGradient(mx, my, 0, mx, my, 12 * u.scale);
          g.addColorStop(0, "rgba(255,230,160,0.9)");
          g.addColorStop(1, "rgba(255,176,32,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(mx, my, 12 * u.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = "source-over";
        }
      }
      ctx.globalAlpha = 1;

      // tracers
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      for (const b of bullets) {
        ctx.strokeStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 7;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(b.x - b.vx * 0.04, b.y - b.vy * 0.04);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // explosion particles
      for (const p of parts) {
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      step(dt);
      draw();
    };
    const start = () => {
      if (running || frozen || !visible || document.hidden) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const img = new Image();
    img.onload = () => {
      sheet = keyWhite(img);
      fw = img.width / COLS;
      fh = img.height / ROWS;
      resize();
      start();
    };
    img.src = SHEET;

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
      (window as unknown as { __freeze3D?: (on: boolean) => void }).__freeze3D?.(!visible);
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);

    const w = window as unknown as Record<string, unknown>;
    w.__freezeBattle = (f: boolean) => {
      frozen = f;
      if (f) stop();
      else start();
    };
    w.__battleStats = () => ({
      alive: units.filter((u) => u.dead <= 0).length,
      total: units.length,
      bullets: bullets.length,
      parts: parts.length,
      sheet: !!sheet,
      running,
    });
    // debug: manually advance the sim (verification in headless/hidden tabs)
    w.__battleStep = (seconds: number) => {
      const n = Math.ceil(seconds / 0.04);
      for (let i = 0; i < n; i++) step(0.04);
      draw();
      return (w.__battleStats as () => unknown)();
    };

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      delete w.__freezeBattle;
      delete w.__battleStats;
      delete w.__battleStep;
    };
  }, [on]);

  if (!on) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1, pointerEvents: "none" }}
    />
  );
}
