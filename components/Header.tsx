"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { nav } from "@/lib/site-data";
import { Magnetic } from "./Magnetic";

/* Fixed mix-blend header. It retracts on scroll-down and drops back on
   scroll-up so the logotype never sits on top of body copy (the overlap bug).
   Lenis drives it; small dead-zone avoids flicker on tiny scroll jitters. */
export function Header() {
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);

  useLenis((lenis) => {
    const y = lenis.scroll;
    const dy = y - last.current;
    if (y < 90) setHidden(false);
    else if (dy > 6) setHidden(true);
    else if (dy < -6) setHidden(false);
    last.current = y;
  });

  return (
    <header className={`header${hidden ? " header--hidden" : ""}`}>
      <Magnetic strength={0.5}>
        <Link href="/" className="logotype">
          Micky<span className="logotype__reg">®</span>
        </Link>
      </Magnetic>
      <nav>
        {nav.map((n) => (
          <Magnetic key={n.href} strength={0.55}>
            <Link href={n.href}>{n.label}</Link>
          </Magnetic>
        ))}
      </nav>
    </header>
  );
}
