/* Subtle pointer parallax: a window listener writes a normalized target; the
   Rig lerps toward it and offsets the camera. Disabled on touch + reduced
   motion. Module singleton so the render loop reads it allocation-free. */
export const mouseState = { tx: 0, ty: 0, x: 0, y: 0 };

let attached = false;
export function initMouseParallax() {
  if (attached || typeof window === "undefined") return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (reduce || coarse) return;
  attached = true;
  window.addEventListener(
    "pointermove",
    (e) => {
      mouseState.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouseState.ty = (e.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true }
  );
}
