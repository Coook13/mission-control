"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";

/* Route transition: on client navigations a solid panel covers the screen and
   slides up to reveal the incoming page (continuous wipe, no photo swap).
   Skipped on first load (the Loader handles that). */
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
          className="page-wipe"
          aria-hidden="true"
          initial={{ y: 0 }}
          animate={{ y: "-100%" }}
          transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1] }}
        >
          <span>Micky</span>
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: isNav ? 36 : 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: isNav ? 0.28 : 0 }}
      >
        {children}
      </motion.div>
    </>
  );
}
