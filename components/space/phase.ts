/* FLOW ENGINE — the camera path, expressed entirely as PURE FUNCTIONS of the
   scroll progress p ∈ [0,1]. Nothing here integrates hidden state, so the whole
   fly-through scrubs forward AND reverses exactly on scroll-up (anti-pattern
   #10). The camera flies FORWARD along -z; lateral drift is a gentle S-curve;
   `enter` grows the black-hole O as we punch through it; `BEATS`/`beatLocal`
   give the DOM panels their per-beat phase. Consumed by Scene's Rig (camera
   position), BlackHole3D (grow-on-approach) and FlowPanels (per-beat fly-past). */

/* Total forward camera travel (world units) across the full scroll. Large
   enough that the 5 beats sit far apart in depth — only one panel is ever near
   the camera plane at a time, so beats approach and recede instead of clumping
   at the vanishing point. */
export const FLIGHT_Z = 1180;

/* The five content beats, in scroll-progress space. Camera decelerates ONTO
   each of these and accelerates BETWEEN them. */
export const BEATS: number[] = [0.3, 0.42, 0.54, 0.66, 0.78];

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

/* Hermite smoothstep — slow at both ends (zero slope), fast in the middle.
   Used per inter-anchor segment so each segment reads as "accelerate out of the
   beat just left, decelerate into the beat ahead". */
const smoothstep = (u: number): number => {
  const t = clamp01(u);
  return t * t * (3 - 2 * t);
};

/* smootherstep (Perlin) — even flatter ends than smoothstep, for the heavy
   decel of the final arrival glide. */
const smootherstep = (u: number): number => {
  const t = clamp01(u);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

export function enter(p: number): number {
  // 0 before the dive, 1 once through; smoothstep across the ENTER window.
  return smoothstep((p - 0.1) / (0.2 - 0.1));
}

/* ---- Camera distance budget ------------------------------------------------
   Anchors in p that the eased travel passes through. The fraction of total
   distance assigned to each segment is tuned so the long TRAVEL stretch
   (0.20→0.85) is the bulk of the journey, the ENTER dive is a quick punch, and
   the final ARRIVAL is a slow settle. Distances are cumulative and strictly
   increasing → dist(p) is monotonic → fully reversible. */
const HERO_END = 0.1; //  p0.00–0.10  near-still in the void
const ENTER_END = 0.2; // p0.10–0.20  punch through the O
const TRAVEL_START = ENTER_END; // beats live in 0.20–0.85
const TRAVEL_END = 0.85;

// distance fractions of FLIGHT_Z per phase (sum = 1)
const F_HERO = 0.015; // barely creeps forward while the wordmark holds
const F_ENTER = 0.16; // fast forward punch into/through the black hole
const F_TRAVEL = 0.745; // the long cruise past the 5 beats
// arrival gets the remainder

const D_HERO = F_HERO * FLIGHT_Z;
const D_ENTER = F_ENTER * FLIGHT_Z;
const D_TRAVEL = F_TRAVEL * FLIGHT_Z;

const C_ENTER = D_HERO; // cumulative distance at start of ENTER
const C_TRAVEL = D_HERO + D_ENTER; // at start of TRAVEL
const C_ARRIVE = D_HERO + D_ENTER + D_TRAVEL; // at start of ARRIVAL

/* TRAVEL sub-segmentation: anchors at the start, each BEAT, and the end. Within
   each sub-segment the camera covers an equal-ish share of the travel distance,
   but eased "slow-fast-slow" (smoothstep) so it decelerates as it reaches the
   next beat and accelerates as it leaves the previous one. Equal distance per
   beat-gap keeps beats evenly spaced in depth. */
const TRAVEL_ANCHORS: number[] = [TRAVEL_START, ...BEATS, TRAVEL_END];
const TRAVEL_SEGS = TRAVEL_ANCHORS.length - 1;
const D_PER_SEG = D_TRAVEL / TRAVEL_SEGS;

/* Cumulative forward distance travelled by progress p. */
function dist(p: number): number {
  if (p <= 0) return 0;

  // HERO — gentle linear creep (camera near-still in the void)
  if (p < HERO_END) {
    return (p / HERO_END) * D_HERO;
  }

  // ENTER — fast smoothstep punch through the black hole
  if (p < ENTER_END) {
    const u = (p - HERO_END) / (ENTER_END - HERO_END);
    return C_ENTER + smoothstep(u) * D_ENTER;
  }

  // TRAVEL — per-beat eased sub-segments (decel onto beat, accel between)
  if (p < TRAVEL_END) {
    let i = 0;
    while (i < TRAVEL_SEGS && p >= TRAVEL_ANCHORS[i + 1]) i++;
    const a = TRAVEL_ANCHORS[i];
    const b = TRAVEL_ANCHORS[i + 1];
    const u = (p - a) / (b - a);
    return C_TRAVEL + i * D_PER_SEG + smoothstep(u) * D_PER_SEG;
  }

  // ARRIVAL — slow settle to the calm wide shot (heavy decel)
  const u = (p - TRAVEL_END) / (1 - TRAVEL_END);
  return C_ARRIVE + smootherstep(u) * (FLIGHT_Z - C_ARRIVE);
}

/* Eased camera z. Camera starts at z = +Z0 looking down -z (the black-hole O
   sits ahead at a fixed negative z) and flies FORWARD (z decreasing) by dist(p).
   ease-OUT decel into each beat, ease-IN accel between (see dist). */
const Z0 = 14; // hero camera z; the black hole lives near z ≈ -40 ahead
export function zOfP(p: number): number {
  return Z0 - dist(p);
}

/* Gentle lateral S-curve drift (x,y) so the cruise feels piloted, not on rails.
   Small amplitude; two out-of-phase sines on x and a slower cosine bob on y.
   Amplitude eases in after the ENTER punch (still while diving) and tapers to
   ~0 at ARRIVAL so the final shot is dead calm. Pure in p → reverses. */
export function driftXY(p: number): [number, number] {
  // 0 during hero/enter, full through travel, back to ~0 at arrival
  const amp = smoothstep((p - 0.18) / 0.12) * (1 - smoothstep((p - 0.86) / 0.14));
  const x = Math.sin(p * Math.PI * 3.0) * 3.2 * amp;
  const y = Math.cos(p * Math.PI * 2.0 + 0.6) * 1.6 * amp;
  return [x, y];
}

/* Raw signed scroll-distance of p from beat i. Negative = beat is still ahead
   (approaching), 0 = centred, positive = camera has passed it (receding).
   FlowPanels builds each panel's transform as a continuous f(beatLocal). */
export function beatLocal(i: number, p: number): number {
  return p - BEATS[i];
}
