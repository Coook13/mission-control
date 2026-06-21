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
   at the vanishing point. Sized so the climax push (the largest single surge,
   below) has the raw reach to read as an awe-scale jump, not a nudge. */
export const FLIGHT_Z = 1480;

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
   The GRAND ARC. The FLIGHT_Z budget is spent deliberately UNEVENLY so the
   journey reads as a four-act crescendo:

     HERO     0.00–0.10  vast open — near-still creep in the void (awe of scale)
     ENTER    0.10–0.20  the punch through the O
     TRAVEL   0.20–0.85  the 5 beats, but paced as an escalation: a light-speed
                         SURGE out of the punch (warp window 1), then building
                         pushes through the middle beats, then the BIGGEST push
                         of the whole flight into the climax (warp window 2)
     ARRIVAL  0.85–1.00  slow, calm, heavy decel — the dust settles

   Distances are cumulative and strictly increasing → dist(p) is monotonic →
   camera-z is monotonic → fully reversible. All drama lives in the WEIGHTS, not
   in the sign of any step, so the scrub-and-reverse contract is never broken. */
const HERO_END = 0.1; //  p0.00–0.10  near-still in the void
const ENTER_END = 0.2; // p0.10–0.20  punch through the O
const TRAVEL_START = ENTER_END; // beats live in 0.20–0.85
const TRAVEL_END = 0.85;

// distance fractions of FLIGHT_Z per phase (sum = 1)
const F_HERO = 0.008; // barely creeps forward while the wordmark holds (vast/slow)
const F_ENTER = 0.15; // fast forward punch into/through the black hole
const F_TRAVEL = 0.73; // the long, dramatically-paced cruise past the 5 beats
// arrival gets the remainder (~0.112) — a long slow settle

const D_HERO = F_HERO * FLIGHT_Z;
const D_ENTER = F_ENTER * FLIGHT_Z;
const D_TRAVEL = F_TRAVEL * FLIGHT_Z;

const C_ENTER = D_HERO; // cumulative distance at start of ENTER
const C_TRAVEL = D_HERO + D_ENTER; // at start of TRAVEL
const C_ARRIVE = D_HERO + D_ENTER + D_TRAVEL; // at start of ARRIVAL

/* TRAVEL sub-segmentation: anchors at the start, each BEAT, and the end. Each
   sub-segment is eased "slow-fast-slow" (smoothstep) so the camera decelerates
   ONTO the next beat and accelerates OFF the previous one. The crescendo comes
   from the per-segment distance WEIGHTS — they are deliberately NOT equal:

   Anchors:  [START, B0, B1, B2, B3, B4, END]
   Segments:    0    1   2   3   4   5

   seg 0 START→B0 : the warp-1 SURGE right out of the punch (warpAt 0.205–0.285
                    lives here) — long, fast launch into the field   (large)
   seg 1 B0→B1    : ease back, settle onto beat 1                    (small/calm)
   seg 2 B1→B2    : escalation building — a moderate push            (medium)
   seg 3 B2→B3    : breathe, ease onto beat 4                        (small/calm)
   seg 4 B3→B4    : escalation rising further into the run-up        (medium-large)
   seg 5 B4→END   : the CLIMAX push — biggest surge of the flight; the
                    warp-2 window (0.800–0.870) straddles the end of this
                    segment into arrival, so the visual warp and the kinetic
                    speed peak together                              (largest)

   Beats themselves stay calm because each lands at a segment boundary where the
   smoothstep slope is ~0 (decel in / accel out). */
const TRAVEL_ANCHORS: number[] = [TRAVEL_START, ...BEATS, TRAVEL_END];
const TRAVEL_SEGS = TRAVEL_ANCHORS.length - 1; // 6
const SEG_WEIGHTS: number[] = [1.55, 0.7, 1.0, 0.75, 1.35, 2.15];
const SEG_WEIGHT_SUM = SEG_WEIGHTS.reduce((a, b) => a + b, 0);
// cumulative distance (world units) at the START of each travel segment
const SEG_DIST: number[] = (() => {
  const out: number[] = [0];
  let acc = 0;
  for (let i = 0; i < TRAVEL_SEGS; i++) {
    acc += (SEG_WEIGHTS[i] / SEG_WEIGHT_SUM) * D_TRAVEL;
    out.push(acc);
  }
  return out; // length TRAVEL_SEGS + 1; out[TRAVEL_SEGS] === D_TRAVEL
})();

/* Cumulative forward distance travelled by progress p. Strictly increasing. */
function dist(p: number): number {
  if (p <= 0) return 0;

  // HERO — vast-open near-still creep (smootherstep: glassy, almost frozen start)
  if (p < HERO_END) {
    return smootherstep(p / HERO_END) * D_HERO;
  }

  // ENTER — fast smoothstep punch through the black hole
  if (p < ENTER_END) {
    const u = (p - HERO_END) / (ENTER_END - HERO_END);
    return C_ENTER + smoothstep(u) * D_ENTER;
  }

  // TRAVEL — weighted, eased sub-segments (decel onto beat, surge between)
  if (p < TRAVEL_END) {
    let i = 0;
    while (i < TRAVEL_SEGS && p >= TRAVEL_ANCHORS[i + 1]) i++;
    const a = TRAVEL_ANCHORS[i];
    const b = TRAVEL_ANCHORS[i + 1];
    const u = (p - a) / (b - a);
    const segLen = SEG_DIST[i + 1] - SEG_DIST[i];
    return C_TRAVEL + SEG_DIST[i] + smoothstep(u) * segLen;
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

/* ---- Set-piece drivers (pure in p) ----------------------------------------
   Added per the P2-B contract. Both are pure functions of scroll progress so
   the set-pieces scrub AND reverse exactly like everything else (anti-pattern
   #10). They feed the camera bank and the warp-streak intensity; they never
   integrate state and never touch flightState. */

/* Smooth raised-cosine bump: 0 at the window edges, 1 at the centre, with zero
   slope at both ends (no kink as a set-piece enters/leaves frame). Pure. */
function bump(p: number, lo: number, hi: number): number {
  if (p <= lo || p >= hi) return 0;
  const u = (p - lo) / (hi - lo); // 0..1 across the window
  return 0.5 - 0.5 * Math.cos(u * Math.PI * 2); // 0→1→0, flat ends
}

/* Camera bank (roll) in radians, pure in p. The flight stays level through the
   hero and the punch, then banks gently into the cruise — one slow roll one way
   as we cross the debris belt, the opposite way through the sun-flare pass, and
   levels off dead-calm for the arrival. Small amplitude (~7°): it reads as a
   piloted craft leaning into the move, never a barrel-roll. Consumed by Scene's
   Rig (cam.rotation.z). */
const ROLL_AMP = 0.12; // ~6.9° max bank
export function rollOfP(p: number): number {
  // ease the bank in after the punch-through, taper to 0 for arrival
  const gate = smoothstep((p - 0.2) / 0.08) * (1 - smoothstep((p - 0.84) / 0.12));
  // two opposed slow leans across the cruise (one full slow S over 0.2→0.84)
  const lean = Math.sin((p - 0.2) * Math.PI * 2.0);
  return lean * ROLL_AMP * gate;
}

/* Warp-streak intensity 0..1, pure in p, spiking in EXACTLY TWO windows that
   sit BETWEEN beats — the grand arc's two acceleration surges:
     - ESCALATION  p 0.205→0.285 : the light-speed launch right after the punch,
       before beat 1 — the journey "kicks into warp".
     - CLIMAX      p 0.800→0.870 : the final hard push between the last beat and
       the arrival settle — the biggest jump, into the finale.
   Both are raised-cosine bumps (smooth in/out), so streaks bloom up and fall
   away cleanly and reverse exactly. Returns 0 everywhere else → the WarpJump
   component is invisible (and can early-out) outside its windows. Consumed by
   WarpJump.tsx. */
export function warpAt(p: number): number {
  const escalation = bump(p, 0.205, 0.285);
  const climax = bump(p, 0.8, 0.87);
  // climax punches a touch harder than the first surge
  return Math.min(1, escalation * 0.92 + climax * 1.0);
}
