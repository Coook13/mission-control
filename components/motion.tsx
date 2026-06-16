"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from "framer-motion";
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
      queueMicrotask(() => setInView(true));
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

function useInViewOnce(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      queueMicrotask(() => setInView(true));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

export type Word = { t?: string; serif?: boolean; br?: boolean };

/* Per-CHARACTER masked rise, staggered — kinetic headings (danilo-style).
   Words stay unbreakable flex items (wrapping + kerning preserved); each word
   clips its own chars so the letters rise out of the baseline one by one.
   aria-label carries the real phrase so SR users don't hear it spelled out. */
export function WordReveal({
  words,
  className,
  delay = 0,
  as = "h2",
  speed,
}: {
  words: Word[];
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "p" | "div";
  speed?: number;
}) {
  const Tag = as;
  const { ref, inView } = useInViewOnce();
  const label = words
    .filter((w) => !w.br && w.t)
    .map((w) => w.t)
    .join(" ");
  let ci = 0;
  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`wreveal ${className ?? ""} ${inView ? "words-in" : ""}`}
      aria-label={label}
      data-speed={speed}
    >
      {words.map((w, i) => {
        if (w.br) return <span className="wbreak" key={`b${i}`} aria-hidden="true" />;
        return (
          <span className={`wword${w.serif ? " serif" : ""}`} key={i} aria-hidden="true">
            {[...(w.t ?? "")].map((c, j) => {
              const d = delay + ci * 0.026;
              ci++;
              return (
                <span className="wchar" key={j} style={{ transitionDelay: `${d}s` }}>
                  {c}
                </span>
              );
            })}
          </span>
        );
      })}
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
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-strength, strength]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.08, 1.02, 1.08]);
  // scroll-velocity skew — the whole-page "liquid/alive" movement
  const velocity = useVelocity(scrollY);
  const skewRaw = useTransform(velocity, [-2400, 0, 2400], [3.4, 0, -3.4], { clamp: true });
  const skewY = useSpring(skewRaw, { stiffness: 250, damping: 34, mass: 0.4 });
  return (
    <motion.div
      ref={ref}
      className={`pimg ${className ?? ""}`}
      initial={reduce ? false : { clipPath: "inset(100% 0% 0% 0%)" }}
      whileInView={reduce ? undefined : { clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="pimg__zoom">
        <motion.img src={src} alt={alt} style={reduce ? undefined : { y, scale, skewY }} />
      </div>
    </motion.div>
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
