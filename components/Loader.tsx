"use client";

import { useEffect, useState } from "react";

/* Intro cover: name flashes, panel lifts. Short enough to never annoy. */
export function Loader() {
  const [phase, setPhase] = useState<"hold" | "lift" | "gone">("hold");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("lift"), 950);
    const t2 = setTimeout(() => setPhase("gone"), 1750);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (phase === "gone") return null;
  return (
    <div className={`loader ${phase === "lift" ? "loader--lift" : ""}`} aria-hidden="true">
      <div className="loader__inner">
        <span className="loader__name">Micky</span>
        <span className="loader__sub">Baramee Thanawarothon · บารมี</span>
      </div>
    </div>
  );
}
