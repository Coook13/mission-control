"use client";

import type { ReactNode } from "react";
import { useInViewOnce } from "./motion";

/* Section label that leads the per-section choreography: when it scrolls into
   view its text slides in and the trailing rule-line draws across. The outer
   element keeps data-speed so it still parallaxes (the entrance lives on the
   inner span / ::after, independent of the parallax translate). */
export function SecLabel({
  children,
  speed,
  className = "",
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const { ref, inView } = useInViewOnce(0.25);
  return (
    <div
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`sec-label label ${className} ${inView ? "is-in" : ""}`}
      data-speed={speed}
    >
      <span className="sec-label__txt">{children}</span>
    </div>
  );
}
