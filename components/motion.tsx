"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

/* Headline lines that slide up out of a mask, staggered.
   Own IntersectionObserver + CSS transition: deterministic, framer-free. */
export function Lines({
  lines,
  className,
  delay = 0,
  as = "h1",
}: {
  lines: ReactNode[];
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "p" | "div";
}) {
  const Tag = as;
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag className={`${className ?? ""} ${inView ? "lines-in" : ""}`} ref={ref as any}>
      {lines.map((l, i) => (
        <span className="mask" key={i}>
          <span className="mask__inner" style={{ transitionDelay: `${delay + i * 0.09}s` }}>
            {l}
          </span>
        </span>
      ))}
    </Tag>
  );
}

/* Image that drifts and breathes with scroll. */
export function ParallaxImg({
  src,
  alt,
  className,
  strength = 60,
}: {
  src: string;
  alt: string;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-strength, strength]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.08, 1.02, 1.08]);
  return (
    <div ref={ref} className={`pimg ${className ?? ""}`}>
      <motion.img src={src} alt={alt} style={{ y, scale }} />
    </div>
  );
}

/* Generic fade-up reveal (kept for body copy). */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
