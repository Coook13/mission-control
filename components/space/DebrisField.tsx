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

/* The p-window the debris belt occupies — between beats 3 and 4, mid-cruise, so
   the camera tears through wreckage at the heart of the journey. */
const DEBRIS_LO = 0.44;
const DEBRIS_HI = 0.62;

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const smoothstep = (u: number): number => {
  const t = clamp01(u);
  return t * t * (3 - 2 * t);
};

/* Master opacity: fade up over the first fifth of the window, hold, fade out
   over the last fifth. Pure in p → reverses exactly. */
function debrisOpacity(p: number): number {
  if (p <= DEBRIS_LO || p >= DEBRIS_HI) return 0;
  const u = (p - DEBRIS_LO) / (DEBRIS_HI - DEBRIS_LO); // 0..1 across the window
  const up = smoothstep(u / 0.2); // 0→1 over first 20%
  const down = 1 - smoothstep((u - 0.8) / 0.2); // 1→0 over last 20%
  return up * down;
}

export function DebrisField({ count = 340, spread = 36, band = 240 }: { count?: number; spread?: number; band?: number }) {
  const inst = useRef<THREE.InstancedMesh>(null);

  // per-shard immutable seeds (base position in the band, size, spin axis/rate)
  const shards = useMemo(() => {
    const rand = mulberry32(count * 22695477 + 13);
    const arr: { x: number; y: number; z: number; s: number; ax: THREE.Vector3; rate: number; phase: number }[] = [];
    for (let i = 0; i < count; i++) {
      const x = (rand() - 0.5) * spread;
      const y = (rand() - 0.5) * spread * 0.8;
      const z = rand() * band; // wrapped per-frame relative to the camera
      const s = 0.12 + rand() * rand() * 0.9; // mostly small shards, a few bigger
      const ax = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
      const rate = 0.2 + rand() * 0.8;
      const phase = rand() * 6.283;
      arr.push({ x, y, z, s, ax, rate, phase });
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

    for (let i = 0; i < shards.length; i++) {
      const sh = shards[i];
      // pure wrap of z relative to camera (mirrors the starfield) → reverses
      const zWrapped = top - ((((top - sh.z) % band) + band) % band);
      dummy.position.set(sh.x + camX * 0.15, sh.y + camY * 0.15, zWrapped);
      // slow tumble (cosmetic; t only — never touches p)
      quat.setFromAxisAngle(sh.ax, t * sh.rate + sh.phase);
      dummy.quaternion.copy(quat);
      // shrink with the master opacity so shards "wink in" rather than pop
      const sc = sh.s * (0.6 + 0.4 * op);
      dummy.scale.setScalar(sc);
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
