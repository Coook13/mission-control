/* Shared flight progress — the SINGLE source of truth for the fly-through.
   `target` is written by the Lenis scroll callback in Flythrough; `progress`
   is what the render loop (camera Rig, BlackHole3D) reads. Per the contract
   there is NO second lerp here: progress = target (only Lenis smooths the
   scroll), so the whole sequence is a pure function of scroll and scrubs AND
   reverses exactly. A plain mutable singleton keeps useFrame allocation-free
   and avoids prop/context churn across the dynamic (ssr:false) canvas boundary. */
export const flightState = {
  target: 0, // 0..1 scroll progress through the .fly section (written by Lenis)
  progress: 0, // 0..1 value the camera/black-hole read (== target, no 2nd lerp)
};

/* Reset on (re)mount / route-return so a reload or nav-back never leaves the
   camera + hero overlay stranded mid-flight. */
export function resetFlight(): void {
  flightState.target = 0;
  flightState.progress = 0;
}
