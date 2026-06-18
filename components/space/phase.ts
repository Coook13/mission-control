/* Single source of truth for the flight, as PURE FUNCTIONS of scroll progress
   p ∈ [0,1]. Every component (camera, planets, warp streaks, rocket) reads from
   here. No integrated/hidden state → the whole sequence scrubs and reverses
   exactly on scroll-up. */

export const FLIGHT_Z = 1120; // total forward camera travel over the scroll

// segment boundaries in p
export const SEG = { heroEnd: 0.06, warpInEnd: 0.2, decelEnd: 0.26, beatsEnd: 0.88 };

const easeInQuad = (u: number) => u * u;
const easeOutQuad = (u: number) => 1 - (1 - u) * (1 - u);
const easeInOut = (u: number) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
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

/* Warp intensity 0..1: ramps up across warp-in, back down across decel, zero
   through cruise, then up again across warp-out. Pure function of p. */
export function warp(p: number): number {
  if (p < SEG.heroEnd) return 0;
  if (p < SEG.warpInEnd) return easeInOut((p - SEG.heroEnd) / (SEG.warpInEnd - SEG.heroEnd));
  if (p < SEG.decelEnd) return 1 - easeInOut((p - SEG.warpInEnd) / (SEG.decelEnd - SEG.warpInEnd));
  if (p < SEG.beatsEnd) return 0;
  return easeInOut(clamp01((p - SEG.beatsEnd) / (1 - SEG.beatsEnd)));
}
