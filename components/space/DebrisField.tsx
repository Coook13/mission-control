"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mulberry32 } from "./rng";
import { flightState } from "./flightState";

/* DEBRIS FIELD — a belt of small monochrome shards the camera rakes THROUGH in
   one mid-cruise p-window. An instanced mesh (one draw call) of low-poly
   octahedra: cheap, sharp-edged (no low-res sphere planets — anti-pattern #2),
   monochrome, lit flat so only their rim catches the bloom.

   Pure-in-p + reverse-safe (anti-pattern #10), the SAME scheme as the starfield:
   each shard's immutable base z is WRAPPED, via mod(), into a rolling band that
   sits ahead of the camera, so its rendered z is a pure function of the camera z
   — no mutated/integrated transform, no history. The whole belt's opacity is a
   pure window in p (DEBRIS_LO..DEBRIS_HI): it fades up as the camera enters the
   field, holds as it punches through, and fades out behind. Scroll back up and
   the shards return identically.

   uTime drives only a slow per-shard tumble (cosmetic); it never touches the
   scrub. Outside the window the mesh is hidden (visible=false) → zero cost. */

/* The p-window the debris belt occupies — pulled into the GAP between beats 2
   (0.54) and 3 (0.66) so the shard PEAK lands ~0.60, dead-centre of the gap,
   where NO FlowPanel is in HOLD (a HOLD spans its beat ±0.02 → 0.52–0.56 and
   0.64–0.68 here). The belt therefore tears past in the dark stretch between
   content beats instead of obliterating a panel mid-read. */
const DEBRIS_LO = 0.555;
const DEBRIS_HI = 0.645;

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const smoothstep = (u: number): number => {
  const t = clamp01(u);
  return t * t * (3 - 2 * t);
};

/* Flight axis — shards spear along this and spin around it (the rake). */
const AXIS_Z = new THREE.Vector3(0, 0, 1);

/* Master opacity: fade up over the first fifth of the window, hold, fade out
   over the last fifth. Pure in p → reverses exactly. */
function debrisOpacity(p: number): number {
  if (p <= DEBRIS_LO || p >= DEBRIS_HI) return 0;
  const u = (p - DEBRIS_LO) / (DEBRIS_HI - DEBRIS_LO); // 0..1 across the window
  const up = smoothstep(u / 0.2); // 0→1 over first 20%
  const down = 1 - smoothstep((u - 0.8) / 0.2); // 1→0 over last 20%
  return up * down;
}

/* Local raised-cosine speed proxy across the belt window — 0 at the edges, 1 at
   the centre (~0.60), flat ends. This is NOT warpAt (owned by another group); it
   is a private envelope so the shards visibly TEAR past — they elongate along the
   flight axis fastest as the camera punches through the heart of the belt, then
   relax as it clears. Pure in p → reverses exactly. */
function debrisRake(p: number): number {
  if (p <= DEBRIS_LO || p >= DEBRIS_HI) return 0;
  const u = (p - DEBRIS_LO) / (DEBRIS_HI - DEBRIS_LO); // 0..1 across the window
  return 0.5 - 0.5 * Math.cos(u * Math.PI * 2); // 0→1→0, zero slope at edges
}

export function DebrisField({ count = 800, spread = 52, band = 170 }: { count?: number; spread?: number; band?: number }) {
  const inst = useRef<THREE.InstancedMesh>(null);

  // per-shard immutable seeds (base position in the band, size, spin axis/rate)
  const shards = useMemo(() => {
    const rand = mulberry32(count * 22695477 + 13);
    const arr: { x: number; y: number; z: number; s: number; rate: number; phase: number }[] = [];
    for (let i = 0; i < count; i++) {
      // wider belt cross-section so the camera threads a VAST field, not a
      // mid-frame clump; areal-ish fill keeps the edges populated too.
      const x = (rand() - 0.5) * spread;
      const y = (rand() - 0.5) * spread * 0.82;
      const z = rand() * band; // wrapped per-frame relative to the camera
      // size range: most shards stay small; a SLIMMER tail of big boulders (now
      // ~10% of shards, max ~1.8u not ~2.6u) whip past for parallax WITHOUT
      // flattening into white near-lens quads under the bloom.
      const big = rand() < 0.1 ? 0.8 + rand() * 1.0 : rand() * rand() * 0.95;
      const s = 0.16 + big;
      const rate = 0.2 + rand() * 0.8;
      const phase = rand() * 6.283;
      arr.push({ x, y, z, s, rate, phase });
    }
    return arr;
  }, [count, spread, band]);

  // scratch objects — allocation-free render loop
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);

  // start hidden so the first paint (before the loop) is never a wall of shards
  useLayoutEffect(() => {
    if (inst.current) inst.current.visible = false;
  }, []);

  useFrame((state) => {
    const mesh = inst.current;
    if (!mesh) return;
    const p = flightState.progress; // == target (no 2nd lerp)
    const op = debrisOpacity(p);
    mesh.visible = op > 0.001;
    if (!mesh.visible) return;

    const camZ = state.camera.position.z;
    const t = state.clock.elapsedTime;
    // band sits ahead of the camera; top a sliver behind so shards stream past.
    const top = camZ + 6;
    const camX = state.camera.position.x;
    const camY = state.camera.position.y;

    // speed proxy → how hard the shards RAKE/streak along the flight axis right
    // now. Peaks mid-belt so the camera reads as "tearing through wreckage".
    const rake = debrisRake(p);
    const streak = 1 + rake * 5.0; // z-elongation at the heart of the belt
    const squash = 1 - rake * 0.35; // pinch cross-section so it reads as a streak

    for (let i = 0; i < shards.length; i++) {
      const sh = shards[i];
      // pure wrap of z relative to camera (mirrors the starfield) → reverses
      const zWrapped = top - ((((top - sh.z) % band) + band) % band);
      dummy.position.set(sh.x + camX * 0.15, sh.y + camY * 0.15, zWrapped);
      // RAKE not tumble: align each shard's spin axis with the flight axis (-z)
      // so it spears forward, with a slow spin AROUND that axis (cosmetic; t only,
      // never touches p) — reads as debris streaming past, not floating confetti.
      quat.setFromAxisAngle(AXIS_Z, t * sh.rate * 0.5 + sh.phase);
      dummy.quaternion.copy(quat);
      // shrink with the master opacity so shards "wink in" rather than pop, AND
      // stretch along z (squeeze in x/y) with the speed proxy so near-camera
      // shards smear into forward streaks at the belt's heart. Pure in p.
      const sc = sh.s * (0.6 + 0.4 * op);
      dummy.scale.set(sc * squash, sc * squash, sc * streak);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    // drive the shared material opacity (one material, instanced)
    const mat = mesh.material as THREE.MeshBasicMaterial;
    mat.opacity = op;
  });

  return (
    <instancedMesh ref={inst} args={[undefined, undefined, count]} frustumCulled={false} visible={false}>
      {/* octahedron = sharp, faceted shard; NOT a sphere (anti-pattern #2) */}
      <octahedronGeometry args={[1, 0]} />
      {/* flat near-white, additive so only the catch-light blooms; monochrome */}
      <meshBasicMaterial
        color="#c4d4f0"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
