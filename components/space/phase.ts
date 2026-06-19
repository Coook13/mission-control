/* Single source of truth for the flight, as PURE FUNCTIONS of scroll progress
   p ∈ [0,1]. Every component (camera, planets, warp streaks, rocket) reads from
   here. No integrated/hidden state → the whole sequence scrubs and reverses
   exactly on scroll-up. */

export const FLIGHT_Z = 1120; // total forward camera travel over the scroll

// segment boundaries in p
export const SEG = { heroEnd: 0.06, warpInEnd: 0.2, decelEnd: 0.26, beatsEnd: 0.88 };

const easeInQuad = (u: number) => u * u;
const easeOutQuad = (u: number) => 1 - (1 - u) * (1 - u);
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

// distance budget per segment (fractions of FLIGHT_Z): hero is slow, warp-in
// covers the most ground (the acceleration), cruise is the long steady stretch
// the planets live in, warp-out re-accelerates briefly.
const DH = 0.02 * FLIGHT_Z; // hero
const DW = 0.24 * FLIGHT_Z; // warp-in (accelerate)
const DD = 0.06 * FLIGHT_Z; // decel
const DC = 0.62 * FLIGHT_Z; // cruise (planet beats)
// warp-out gets the remaining 0.06
const CW = DH; // cumulative distance at start of warp-in
const CD = DH + DW; // start of decel
const CC = DH + DW + DD; // start of cruise
const CO = DH + DW + DD + DC; // start of warp-out

/* Cumulative forward distance travelled by p. Strictly increasing (each
   segment ease maps [0,1]→[0,1] monotonically) → reversible. */
export function dist(p: number): number {
  if (p <= 0) return 0;
  if (p < SEG.heroEnd) return (p / SEG.heroEnd) * DH;
  if (p < SEG.warpInEnd) {
    const u = (p - SEG.heroEnd) / (SEG.warpInEnd - SEG.heroEnd);
    return CW + easeInQuad(u) * DW;
  }
  if (p < SEG.decelEnd) {
    const u = (p - SEG.warpInEnd) / (SEG.decelEnd - SEG.warpInEnd);
    return CD + easeOutQuad(u) * DD;
  }
  if (p < SEG.beatsEnd) {
    const u = (p - SEG.decelEnd) / (SEG.beatsEnd - SEG.decelEnd);
    return CC + u * DC;
  }
  const u = clamp01((p - SEG.beatsEnd) / (1 - SEG.beatsEnd));
  return CO + easeInQuad(u) * (FLIGHT_Z - CO);
}

export function zOfP(p: number): number {
  return 12 - dist(p);
}

/* World-z for a planet so it sits `approach` units ahead of the camera at its
   peak. Derived against the non-linear map → keeps each planet framed at its
   beat regardless of the easing. */
export function planetZ(peak: number, approach = 42): number {
  return zOfP(peak) - approach;
}

/* Rocket z-offset relative to the camera (negative = AHEAD of the camera).
   Starts behind the camera (hidden), accelerates past during warp-in (crosses
   0 ≈ p0.11 = the swoosh), settles to a steady lead through cruise, then races
   far ahead into the warp-out. Pure function of p → the swoosh reverses on
   scroll-up. */
export function rocketLead(p: number): number {
  if (p < 0.05) return 30; // behind the camera, off-screen
  if (p < 0.15) return 30 + easeInQuad((p - 0.05) / 0.1) * -75; // 30 -> -45 (swoosh past)
  if (p < 0.24) return -45 + easeOutQuad((p - 0.15) / 0.09) * 25; // -45 -> -20 (settle)
  if (p < SEG.beatsEnd) return -20; // lead the cruise
  return -20 + easeInQuad(clamp01((p - SEG.beatsEnd) / (1 - SEG.beatsEnd))) * -110; // -20 -> -130 (race out)
}

/* Rocket lateral offset (x,y) relative to the camera. Enters low-left, sweeps
   in beside the camera during the swoosh, then leads low-centre through cruise
   and rises toward the centre as it races into the warp-out hole. */
export function rocketPath(p: number): [number, number] {
  if (p < 0.05) return [-7, -7.5];
  if (p < 0.24) {
    const s = easeOutQuad((p - 0.05) / 0.19);
    return [-7 + s * 7, -7.5 + s * 1.5]; // -> (0, -6) low-centre, leading
  }
  if (p < SEG.beatsEnd) return [0, -6];
  const s = easeInQuad(clamp01((p - SEG.beatsEnd) / (1 - SEG.beatsEnd)));
  return [0, -6 + s * 4.5]; // rise toward centre into the warp hole
}

/* Warp intensity 0..1, pulsed BETWEEN dwell points (hero + 5 beats + exit):
   ~0 when settled on a planet, ramping to 1 in the gaps so we "warp between
   galaxies" — the light-speed streaks mask each crossfade. Pure function of p. */
const DWELL = [0.0, 0.22, 0.38, 0.54, 0.7, 0.85, 1.0];
export function warp(p: number): number {
  let dd = 1;
  for (const d of DWELL) dd = Math.min(dd, Math.abs(p - d));
  return clamp01((dd - 0.02) / 0.05); // 0 within 0.02 of a dwell → 1 by 0.07 away
}
