"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useLenis } from "lenis/react";
import type { IndexRow } from "@/lib/site-data";

/* Work index: rows cascade in on scroll; a big image preview lag-follows the
   cursor on row hover and settles with a zoom. */
/* Preview payload: a real photo (`src`) for slugged items that have a file, or
   a procedural monochrome fallback (`src: null`) for the 4 entries with NO image
   on disk (KMT, Shade Tree, ISSDC, UKROC). `seed` varies the fallback per row so
   each reads distinct, never a broken <img>. */
type Preview = { src: string | null; seed: number };

export function HoverIndex({ rows, split = true }: { rows: IndexRow[]; split?: boolean }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const touch = useRef(false);
  const pos = useRef({ mx: 0, my: 0, x: 0, y: 0, raf: 0 });

  // coarse pointers (touch) get no cursor-chasing preview at all
  useEffect(() => {
    touch.current = window.matchMedia("(pointer: coarse)").matches;
  }, []);

  // any scroll dismisses a stuck preview (was only clearing on row mouseleave)
  useLenis(() => {
    setPreview((prev) => (prev ? null : prev));
  });

  // cursor-chasing preview
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
      p.x += (p.mx - p.x) * 0.13;
      p.y += (p.my - p.y) * 0.13;
      const el = previewRef.current;
      if (el) el.style.transform = `translate(${p.x + 28}px, ${p.y - 150}px) rotate(${(p.mx - p.x) * 0.05}deg)`;
      p.raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    p.raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(p.raf);
    };
  }, []);

  // staggered scroll-in for the rows
  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const els = gsap.utils.toArray<HTMLElement>(".index-row");
      gsap.from(els, {
        yPercent: 65,
        opacity: 0,
        duration: 0.85,
        ease: "power3.out",
        stagger: 0.06,
        scrollTrigger: { trigger: listRef.current, start: "top 82%" },
      });
    },
    { scope: listRef }
  );

  const Row = ({ row }: { row: IndexRow }) => {
    // slugged rows have a real photo at /img/work/<slug>.jpg; the 4 slug-less
    // rows (KMT, Shade Tree, ISSDC, UKROC) have NO file → procedural fallback.
    const next: Preview = row.img
      ? { src: row.img, seed: Number(row.num) }
      : row.slug
      ? { src: `/img/work/${row.slug}.jpg`, seed: Number(row.num) }
      : { src: null, seed: Number(row.num) };
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
    // every row gets a hover preview now — real photo or procedural fallback —
    // so the imageless rows feel intentional, never dead.
    const handlers = {
      onMouseEnter: () => {
        if (!touch.current) setPreview(next);
      },
      onMouseLeave: () => setPreview(null),
    };
    return row.slug ? (
      <Link className="index-row" href={`/work/${row.slug}`} data-cursor="view" {...handlers}>
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
      <div ref={listRef} onMouseLeave={() => setPreview(null)}>
        {split ? (
          <div className="index-grid">
            <div>{rows.slice(0, half).map((r) => <Row key={r.num} row={r} />)}</div>
            <div>{rows.slice(half).map((r) => <Row key={r.num} row={r} />)}</div>
          </div>
        ) : (
          <div>{rows.map((r) => <Row key={r.num} row={r} />)}</div>
        )}
      </div>
      <div ref={previewRef} className={`index-preview ${preview ? "index-preview--on" : ""}`} aria-hidden="true">
        {preview &&
          (preview.src ? (
            <img src={preview.src} alt="" />
          ) : (
            // procedural monochrome fallback — NOT a broken <img>. Seeded hue of
            // the cool accent so each imageless row reads distinct.
            <span
              className="work-fallback"
              data-seed={preview.seed % 4}
            >
              <span className="work-fallback__mark" aria-hidden="true">
                ✦
              </span>
            </span>
          ))}
      </div>
    </>
  );
}
