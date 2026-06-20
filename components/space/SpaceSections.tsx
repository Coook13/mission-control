"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { SCENES } from "./scenes";
import { profile } from "@/lib/site-data";

/* The body, in the hero's deep-space language: five skill areas as scroll
   sections — index + big grotesque label + a dot-matrix one-liner + the real
   work links — closing on the contact line. Sections reveal on scroll. All
   copy is his own (from site-data); the look follows the stark space register. */
export function SpaceSections() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = root.current?.querySelectorAll<HTMLElement>(".bhx-reveal");
    if (!els) return;
    if (reduce) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="bhx-body" ref={root}>
      {SCENES.map((s) => (
        <section className="bhx-sec" key={s.key} aria-label={s.label}>
          <div className="bhx-sec__inner bhx-reveal">
            <span className="bhx-sec__idx">
              {s.idx} <span className="bhx-sec__idx-dim">/ 05</span>
            </span>
            <h2 className="bhx-sec__label">{s.label}</h2>
            <p className="bhx-sec__tag">{s.desc}</p>
            <ul className="bhx-sec__work">
              {s.hotspots.map((h, j) => {
                const isWork = h.href.startsWith("/work");
                return (
                  <li key={j}>
                    <Link className="bhx-work" href={h.href}>
                      <span className="bhx-work__title">{h.title}</span>
                      <span className="bhx-work__line">{h.oneLine}</span>
                      <span className="bhx-work__arrow">{isWork ? "View →" : "Talk →"}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ))}

      <section className="bhx-contact" aria-label="Contact">
        <div className="bhx-reveal bhx-contact__inner">
          <h2 className="bhx-contact__head">
            {profile.contactLead.pre}
            <em>{profile.contactLead.em}</em>
            {profile.contactLead.post}
          </h2>
          <div className="bhx-contact__links">
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
            <a href={profile.linkedin.href} target="_blank" rel="noopener noreferrer">
              {profile.linkedin.label}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
