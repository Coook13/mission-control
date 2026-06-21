"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { flightState } from "./flightState";
import { zOfP } from "./phase";

/* ARRIVAL — the destination payload. As the flight exits the climax warp and the
   camera enters the long arrival settle (p ≈ 0.86 → 1.00), a GRAND form takes
   shape dead-ahead and grows to fill the frame: the black-hole {O} RETURNING at
   massive scale. This is the structural callback to the hero — the same ring that
   framed the "W{O}RK" wordmark at the start re-forms, now colossal, so the journey
   rhymes (Group 1's wordmark {O} re-aligns over this returned hole at the finale).

   Built on BlackHole3D's family but deliberately LARGER-ORDER and a different
   CHARACTER (not the opener replayed): a billboarded disc plane carrying a bright
   event-horizon rim, a sharp photon ring AND a second concentric (lensing) photon
   ring, a slowly-orbiting accretion hot-spot, a faint gravitational-lens warp of
   the field read through the core, and a pure-black shadow — additive over the
   void so only the rings/arc bloom. It grows far past the hero ring's scale so it
   overflows the frame edges and its bloom spills past them. Monochrome (the one
   cool accent, a warm accretion bias), nothing grey, no full sphere, no raymarch —
   a stylised bloomed ring (anti-patterns #2/#5).

   PURE-IN-P (anti-pattern #10): every per-frame value — the lead distance ahead of
   the camera, the swell scale, the master opacity, and the ring/flare shaping — is
   a pure function of flightState.progress via arriveOfP(p). Nothing integrates
   state. Scroll forward and the hole forms and grows; scroll back up and it shrinks
   and dissolves back into the warp, identically. uTime drives only the cosmetic
   accretion shimmer; it never touches the scrub.

   It anchors a fixed lead AHEAD of the camera along the view axis (like BlackHole3D
   and SunFlare reference zOfP), so it is always dead-centre on the flight path
   regardless of how the Rig drifts/banks. Outside the arrival window the group is
   hidden (visible=false) → zero cost across the whole earlier flight. */

/* Arrival window. phase.ts spends p0.85–1.00 on the slow settle; we start the
   reveal a hair into that (after the climax warp has bloomed down, warpAt's climax
   window ends at 0.87) and grow it to fill frame by p1.0. Local to this file —
   phase.ts exports no arrival constant and must not be edited. */
const ARRIVE_LO = 0.86;
const ARRIVE_HI = 1.0;

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const smoothstep = (u: number): number => {
  const t = clamp01(u);
  return t * t * (3 - 2 * t);
};
/* smootherstep — flatter ends, matches phase.ts's heavy arrival decel feel so the
   hole's growth eases to a calm hold as the camera settles. */
const smootherstep = (u: number): number => {
  const t = clamp01(u);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/* The arrival has TWO eased drivers, both pure in p:

   arriveOfP — the monotonic REVEAL intensity (rings sharpen + brighten and HOLD
   bright). Drives the shader's uArrive so the rings stay their sharpest/brightest
   through the finale hold — never deflating to a flat wash. Reaches 1 fast and
   stays 1.

   swellOfP — the SIZE envelope. It SWELLS to a colossal peak at the climax
   (p≈0.90, where the ring overflows the frame harder than the opener) and then
   eases BACK across p≈0.94→1.0 to a COMPOSED, contained value — so the last frame
   is a composed bloomed-ring JEWEL held dead-centre (the wordmark {O} re-aligns
   over it), not a blown-out gradient that fills the lens. Drives lead + scale. */
const SWELL_PEAK = 0.9; // colossal crescendo — biggest/brightest hole of the flight
function arriveOfP(p: number): number {
  if (p <= ARRIVE_LO) return 0;
  if (p >= ARRIVE_HI) return 1;
  // reach full reveal by the peak, then HOLD at 1 through the settle
  const u = (p - ARRIVE_LO) / (SWELL_PEAK - ARRIVE_LO);
  return smootherstep(u); // 0→1 by the peak, clamped 1 after
}

function swellOfP(p: number): number {
  if (p <= ARRIVE_LO) return 0;
  if (p <= SWELL_PEAK) {
    // emerge → colossal peak (overflows the frame)
    return smootherstep((p - ARRIVE_LO) / (SWELL_PEAK - ARRIVE_LO));
  }
  // ease back from the colossal peak (1.0) to a COMPOSED held jewel (~0.62) so the
  // finale is a contained, dead-centre ring — not a blown gradient. Holds there.
  const u = smootherstep((p - SWELL_PEAK) / (ARRIVE_HI - SWELL_PEAK));
  return 1 - u * 0.38; // 1.0 at peak → 0.62 composed hold at p=1.0
}

/* Master opacity: fade up fast as the form emerges from the dissipating warp, then
   hold SOLID through the rest of the settle so the finale lands on a steady,
   composed hole (the wordmark {O} re-aligns over it). Stays solid at p=1 so the
   last frame is the most composed ring, never a fade-out. Pure in p. */
function arrivalOpacity(p: number): number {
  if (p <= ARRIVE_LO || p >= ARRIVE_HI + 0.001) return 0;
  const u = (p - ARRIVE_LO) / (ARRIVE_HI - ARRIVE_LO);
  return smoothstep(u / 0.18); // 0→1 over the first ~18% of the window, then hold solid
}

/* How far ahead of the camera the returned hole sits. It starts deep ahead (a
   distant point emerging out of the warp) and the lead CLOSES as the camera glides
   in, so perspective does most of the "growing to fill the frame" — the same trick
   BlackHole3D uses on ENTER, run in reverse-direction (approach, never overtaken,
   so it holds dead-ahead and dominant at the finale). Pure in p. */
const LEAD_FAR = 240; // distant emergent point at the start of arrival
const LEAD_NEAR = 18; // close + COLOSSAL at the finale (still ahead — never passed)
function leadOfP(a: number): number {
  // lead closes harder than the opener's punch so perspective dwarfs the hero {O}:
  // by the peak the ring is parked very near the lens (18u) at a vast scale, so it
  // overflows the frame edges far harder than the opening punch-through ever does.
  return LEAD_FAR + (LEAD_NEAR - LEAD_FAR) * a;
}

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/* The finale {O} is deliberately a LARGER-ORDER body than the hero hole, and a
   different CHARACTER — not the opener replayed. On the same ring/disc family as
   BlackHole3D (all dying to EXACTLY 0 well inside the quad via the radial edge-
   fade, so the additive falloff never paints a square — a clean CIRCLE at every
   scale, even overflowing the frame), it ADDS three things the hero ring never had:

     1. ACCRETION-DISC SPIN BAND — a bright arc that sweeps slowly AROUND the rim
        (a rotating angular hot-spot, not the hero's static Doppler side), reading
        as matter orbiting a far heavier body.
     2. A SECOND CONCENTRIC PHOTON RING — an inner light ring inside the main
        photon ring, the gravitational-lensing signature of a supermassive hole.
     3. A GRAVITATIONAL-LENS RADIAL WARP — the field read THROUGH the core is bent
        radially (a faint pinch toward the photon sphere just outside the shadow),
        so light appears to wrap the hole rather than pass it.

   uArrive sharpens the rings + lifts the flare + intensifies the lens as the hole
   closes in for the climactic reveal. uTime drives only the cosmetic spin/shimmer
   — never the scrub. Monochrome: the one cool accent + a warm accretion bias. */
const frag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uArrive;  // 0..1 across the arrival window (pure fn of p)
  uniform float uFade;    // master opacity (pure fn of p)
  void main() {
    // quad is oversized vs the disc; p spans [-1.7,1.7]^2 so corners (r≈2.4) sit
    // far outside the ring and the edge-fade reaches 0 before any quad edge.
    vec2 p = (vUv - 0.5) * 3.4;
    float r = length(p);
    float ang = atan(p.y, p.x);
    float t = uTime * 0.2;

    // GRAVITATIONAL-LENS radial warp: pinch the sampled radius toward the photon
    // sphere just outside the shadow so the field reads as bent around the hole.
    // Pure cosmetic on r; strengthens as the hole closes in (uArrive). The warp
    // is centred on the rim radius and dies away from it, so only light NEAR the
    // hole appears to wrap — exactly the lensing look, never a global distortion.
    float r0 = 0.66 + uArrive * 0.04;          // event-horizon rim radius
    float lensAmt = (0.05 + uArrive * 0.06);
    float rl = r - lensAmt * exp(-pow((r - r0) / 0.34, 2.0)) * sign(r - r0);

    // grand ring: a touch wider than the hero hole, photon ring tightens on arrive
    float rimW = 0.06 + uArrive * 0.03;
    float rim = exp(-pow((rl - r0) / rimW, 2.0));
    // PRIMARY photon ring (tight + bright, just inside the rim) — at the arrival
    // peak it is the single brightest ring of the whole flight (gain > the hero
    // hole's 0.85+0.7 and the engulf blaze), so the crescendo lands as the payoff.
    float photon = exp(-pow((rl - (r0 - 0.08)) / 0.014, 2.0)) * (0.9 + uArrive * 1.6);
    // SECOND CONCENTRIC photon ring — an inner lensing ring (the supermassive
    // signature the hero hole lacks). Fainter, tighter, closer to the shadow.
    float photon2 = exp(-pow((rl - (r0 - 0.155)) / 0.010, 2.0)) * (0.45 + uArrive * 1.0);
    float glow = exp(-pow((rl - r0) / (0.30 + uArrive * 0.10), 2.0));

    // ACCRETION-DISC SPIN BAND: a bright arc that orbits AROUND the ring (a moving
    // hot-spot in angle, t-driven), distinct from a static Doppler side. Narrow
    // raised-cosine lobe sweeping at a slow rate → matter circling a heavy body.
    float spinPhase = ang - t * 0.9;
    float band = pow(0.5 + 0.5 * cos(spinPhase), 6.0);   // tight orbiting lobe
    float spin = 0.55 + 1.05 * band;                     // baseline + hot arc

    // residual slow Doppler-bright side + faint shimmer (cosmetic; uTime only)
    float side = 0.5 + 0.5 * cos(ang - t * 1.6);
    float dopp = 0.66 + 0.4 * side;
    float shim = 0.92 + 0.08 * sin(ang * 4.0 - t * 2.4);

    // Temperature contrast at scale: cores stay white-hot, but the broad halo is
    // pushed COLDER toward #a9c6ff/#d6e6ff so the colossal bloomed rim reads as
    // cold starlight against a warm accretion bias — real temperature, not grey.
    vec3 coolGlow = vec3(0.62, 0.76, 1.0);   // coldest broad halo (#a9c6ff-ward)
    vec3 coolRim  = vec3(0.82, 0.89, 1.0);   // near-white cool rim/photon (#d6e6ff)
    vec3 warm = vec3(1.0, 0.84, 0.62);       // warm accretion bias on the bright side
    vec3 ringCol = mix(coolRim, warm, side * 0.40);   // rim + photon rings, cool-led
    vec3 glowCol = mix(coolGlow, warm, side * 0.26);  // broad halo, coldest

    float core = smoothstep(0.30, 0.54, r);          // pure black inside the ring
    float flare = 1.0 + uArrive * 2.0;               // grandest reveal gain of the flight
    float ringsI = (rim * 1.7 + photon * 1.6 + photon2 * 1.1) * dopp * spin * shim;
    float glowI = glow * 0.55 * dopp;
    float intensity = (ringsI + glowI) * core * flare;
    vec3 col = (ringCol * ringsI + glowCol * glowI) * core * flare;
    // radial edge-fade: kill intensity to exactly 0 across r∈[1.35,1.55], far
    // inside the quad edges (r≈1.7) → no box ever shows, even filling the frame.
    float edgeFade = smoothstep(1.55, 1.35, r);
    intensity *= edgeFade;
    col *= edgeFade;
    intensity *= uFade;
    col *= uFade;
    float a = clamp(intensity, 0.0, 1.0);
    gl_FragColor = vec4(col, a);
  }
`;

export function Arrival() {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uArrive: { value: 0 }, uFade: { value: 0 } }),
    []
  );
  const fwd = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const g = group.current;
    const m = mat.current;
    if (!g || !m) return;

    const p = flightState.progress; // == target (single source; no 2nd lerp)
    const fade = arrivalOpacity(p);
    g.visible = fade > 0.001;
    if (!g.visible) return;

    const a = arriveOfP(p);   // monotonic reveal intensity (rings hold bright)
    const sw = swellOfP(p);   // size envelope (peaks colossal, settles to a jewel)
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uArrive.value = a;
    m.uniforms.uFade.value = fade;

    const cam = state.camera;
    // billboard so the flat ring always faces us as it fills the frame
    g.quaternion.copy(cam.quaternion);

    // sit `lead` units dead ahead along the view axis (pure in p) — the lead
    // closes as the swell rises (colossal at the peak) then eases back out a touch
    // for the composed finale hold, so the ring never blows past into a wash.
    cam.getWorldDirection(fwd);
    g.position.copy(cam.position).addScaledVector(fwd, leadOfP(sw));

    // COLOSSAL swell at the peak: grows FAR larger than the hero hole so the ring
    // overflows the frame edges (and its bloom spills past them). Combined with the
    // much-closer lead (18u vs the opener's hero framing), the {O} reads as a
    // larger-ORDER body than the hero ring — the single biggest, brightest hole of
    // the whole flight. Then `sw` eases back so the finale settles to a composed,
    // contained jewel held dead-centre rather than a blown-out wash.
    const s = 40 + sw * 430;
    g.scale.setScalar(s);
  });

  return (
    <group ref={group} visible={false}>
      <mesh frustumCulled={false}>
        {/* oversized quad (3.4 vs unit) → generous transparent margin for the
            additive glow; the shader's radial edge-fade keeps it a clean circle. */}
        <planeGeometry args={[3.4, 3.4]} />
        <shaderMaterial
          ref={mat}
          vertexShader={vert}
          fragmentShader={frag}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
