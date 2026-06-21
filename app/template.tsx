"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import SpaceTransition from "@/components/SpaceTransition";

/* Route transition: on client navigations a brief monochrome hyperspace warp
   covers the screen — stars streaking outward + a central white-out bloom that
   peaks as the page swaps, then clears (~0.9s). Reads like a short jump between
   sections rather than a flat black wipe. Reusable for every route change.
   Skipped on first load (the Loader handles that).
   prefers-reduced-motion -> the warp panel falls back to a quick fade (CSS). */
let navigated = false;

export default function Template({ children }: { children: React.ReactNode }) {
  const isNav = navigated; // false on first load, true on every client navigation
  useEffect(() => {
    navigated = true;
  }, []);

  return (
    <>
      {isNav && (
        <motion.div
          className="space-warp-shell"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.95, ease: "easeInOut", times: [0, 0.22, 0.6, 1] }}
        >
          <SpaceTransition />
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: isNav ? 24 : 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: isNav ? 0.42 : 0 }}
      >
        {children}
      </motion.div>
    </>
  );
}
