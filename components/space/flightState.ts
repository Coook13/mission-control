/* Shared flight progress, written by the scroll handler in Flythrough and read
   inside the R3F render loop. A plain mutable object avoids prop/context churn
   across the dynamic (ssr:false) boundary and keeps useFrame allocation-free. */
export const flightState = {
  target: 0, // 0..1 scroll progress through the flythrough section
  progress: 0, // smoothed value the camera actually uses
  warp: 0, // 0..1 light-speed warp intensity (warp-in / warp-out), pure fn of p
};

/* Reset on (re)mount / route return so a reload or nav-back doesn't leave the
   camera + overlay mid-flight. */
export function resetFlight() {
  flightState.target = 0;
  flightState.progress = 0;
  flightState.warp = 0;
}
