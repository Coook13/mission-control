"use client";

import { useEffect, useState } from "react";
import { BattleLayer } from "./BattleLayer";

/* Type "war" anywhere on the page: the pixel dogfight takes over. ESC closes. */
export function EasterEgg() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let buffer = "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key.length !== 1) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-3);
      if (buffer === "war") setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;
  return (
    <div className="war-overlay">
      <BattleLayer />
      <button className="war-overlay__close" onClick={() => setOpen(false)}>
        ESC to surrender
      </button>
    </div>
  );
}
