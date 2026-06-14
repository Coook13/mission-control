"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { IndexRow } from "@/lib/site-data";

/* Work index with a cursor-chasing image preview on row hover. */
export function HoverIndex({ rows, split = true }: { rows: IndexRow[]; split?: boolean }) {
  const [img, setImg] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ mx: 0, my: 0, x: 0, y: 0, raf: 0 });

  useEffect(() => {
    const p = pos.current;
    const onMove = (e: MouseEvent) => {
      p.mx = e.clientX;
      p.my = e.clientY;
      if (p.x === 0 && p.y === 0) {
        p.x = p.mx;
        p.y = p.my;
      }
    };
    const loop = () => {
      p.x += (p.mx - p.x) * 0.12;
      p.y += (p.my - p.y) * 0.12;
      const el = previewRef.current;
      if (el) el.style.transform = `translate(${p.x + 24}px, ${p.y - 110}px) rotate(${(p.mx - p.x) * 0.04}deg)`;
      p.raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    p.raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(p.raf);
    };
  }, []);

  const Row = ({ row }: { row: IndexRow }) => {
    const thumb = row.slug ? `/img/work/${row.slug}.jpg` : null;
    const inner = (
      <>
        <span className="index-row__num">{row.num}</span>
        <span>
          <span className="index-row__title">{row.title}</span>
          <span className="index-row__kicker">{row.kicker}</span>
        </span>
        <span className="index-row__year">{row.year}</span>
      </>
    );
    const handlers = thumb
      ? { onMouseEnter: () => setImg(thumb), onMouseLeave: () => setImg(null) }
      : {};
    return row.slug ? (
      <Link className="index-row" href={`/work/${row.slug}`} {...handlers}>
        {inner}
      </Link>
    ) : (
      <div className="index-row" {...handlers}>
        {inner}
      </div>
    );
  };

  const half = Math.ceil(rows.length / 2);
  return (
    <>
      {split ? (
        <div className="index-grid">
          <div>{rows.slice(0, half).map((r) => <Row key={r.num} row={r} />)}</div>
          <div>{rows.slice(half).map((r) => <Row key={r.num} row={r} />)}</div>
        </div>
      ) : (
        <div>{rows.map((r) => <Row key={r.num} row={r} />)}</div>
      )}
      <div ref={previewRef} className={`index-preview ${img ? "index-preview--on" : ""}`} aria-hidden="true">
        {img && <img src={img} alt="" />}
      </div>
    </>
  );
}
