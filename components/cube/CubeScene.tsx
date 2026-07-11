"use client";

import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { faceOrder, faces, type FaceId } from "@/lib/site-data";
import {
  FACE_NORMALS,
  moveToTurn,
  rotateTuple,
  swipeToTurn,
  validateMoveSequence,
  type Axis,
  type CubeMove,
  type QuarterTurn,
  type Vector3Tuple,
} from "./cube-model";

type Sticker = {
  faceId: FaceId;
  normal: Vector3Tuple;
  center: boolean;
};

type Cubie = {
  id: string;
  position: Vector3Tuple;
  quaternion: THREE.Quaternion;
  stickers: Sticker[];
};

type ActiveMove = {
  turn: QuarterTurn;
  elapsed: number;
  affected: Array<{
    cubie: Cubie;
    position: THREE.Vector3;
    quaternion: THREE.Quaternion;
  }>;
};

type Gesture = {
  cubieId: string;
  sticker: Sticker;
  x: number;
  y: number;
  pointerId: number;
  moved: boolean;
};

type OrbitGesture = {
  x: number;
  y: number;
  pointerId: number;
  start: THREE.Quaternion;
};

export type CubeStageProps = {
  selectedFace: FaceId | null;
  previewFace: FaceId | null;
  zoom: number;
  scrambleSignal: number;
  resetSignal: number;
  onSelectFace: (face: FaceId) => void;
  onScrambleChange: (scrambled: boolean) => void;
};

type CubeObjectProps = CubeStageProps & { reduceMotion: boolean };

const AXIS_VECTORS: Record<Axis, THREE.Vector3> = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

const PRIMARY_AXES = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, 0, 1),
];

const OPENING_QUATERNION = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(THREE.MathUtils.degToRad(25), THREE.MathUtils.degToRad(-35), 0, "XYZ"),
);

const ENTRANCE_OFFSET = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(THREE.MathUtils.degToRad(-12), THREE.MathUtils.degToRad(28), THREE.MathUtils.degToRad(-7)),
);

const FACE_QUATERNIONS: Record<FaceId, THREE.Quaternion> = {
  engineering: new THREE.Quaternion(),
  venture: new THREE.Quaternion().setFromAxisAngle(AXIS_VECTORS.y, -Math.PI / 2),
  strategy: new THREE.Quaternion().setFromAxisAngle(AXIS_VECTORS.x, Math.PI / 2),
  finance: new THREE.Quaternion().setFromAxisAngle(AXIS_VECTORS.y, Math.PI),
  research: new THREE.Quaternion().setFromAxisAngle(AXIS_VECTORS.y, Math.PI / 2),
  story: new THREE.Quaternion().setFromAxisAngle(AXIS_VECTORS.x, -Math.PI / 2),
};

const MOVE_DURATION = 0.25;
const CUBIE_STEP = 1.02;
const SWIPE_THRESHOLD = 11;
const CUBE_BASE_Y = 0.14;
const SCRAMBLE_MOVES: readonly CubeMove[] = [
  "R", "U", "F'", "L", "D'", "B", "R'", "U'", "F", "L'", "D", "B'", "R", "U'",
];

function createSolvedCubies(): Cubie[] {
  const cubies: Cubie[] = [];
  for (const x of [-1, 0, 1]) {
    for (const y of [-1, 0, 1]) {
      for (const z of [-1, 0, 1]) {
        if (x === 0 && y === 0 && z === 0) continue;
        const position: Vector3Tuple = [x, y, z];
        const stickers = faceOrder.flatMap((faceId) => {
          const normal = FACE_NORMALS[faceId];
          const visible = normal.every((value, index) => value === 0 || value === position[index]);
          if (!visible) return [];
          const center = position[0] === normal[0] && position[1] === normal[1] && position[2] === normal[2];
          return [{ faceId, normal, center } satisfies Sticker];
        });
        cubies.push({ id: `${x}:${y}:${z}`, position, quaternion: new THREE.Quaternion(), stickers });
      }
    }
  }
  return cubies;
}

function stickerRotation(normal: Vector3Tuple) {
  const [x, y, z] = normal;
  if (x === 1) return new THREE.Euler(0, Math.PI / 2, 0);
  if (x === -1) return new THREE.Euler(0, -Math.PI / 2, 0);
  if (y === 1) return new THREE.Euler(-Math.PI / 2, 0, 0);
  if (y === -1) return new THREE.Euler(Math.PI / 2, 0, 0);
  if (z === -1) return new THREE.Euler(0, Math.PI, 0);
  return new THREE.Euler();
}

function makeLabelTexture(code: string, dark: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.clearRect(0, 0, 1024, 1024);
  context.fillStyle = dark ? "#121212" : "#ffffff";
  context.font = `${code.length > 3 ? 700 : 800} ${code.length > 3 ? 184 : 252}px Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(code, 512, 528);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function snapVector(vector: THREE.Vector3): Vector3Tuple {
  const values = [vector.x, vector.y, vector.z];
  const largest = values.reduce((best, value, index) => Math.abs(value) > Math.abs(values[best]) ? index : best, 0);
  const result: Vector3Tuple = [0, 0, 0];
  result[largest] = values[largest] >= 0 ? 1 : -1;
  return result;
}

function CubeObject({
  selectedFace,
  previewFace,
  scrambleSignal,
  resetSignal,
  onSelectFace,
  onScrambleChange,
  reduceMotion,
}: CubeObjectProps) {
  const rootRef = useRef<THREE.Group>(null);
  const cubieRefs = useRef(new Map<string, THREE.Group>());
  const cubies = useMemo(() => createSolvedCubies(), []);
  const cubiesRef = useRef(cubies);
  const activeMove = useRef<ActiveMove | null>(null);
  const queuedMoves = useRef<QuarterTurn[]>([]);
  const lastScrambleSignal = useRef(scrambleSignal);
  const moveHistory = useRef<CubeMove[]>([]);
  const gesture = useRef<Gesture | null>(null);
  const orbitGesture = useRef<OrbitGesture | null>(null);
  const targetQuaternion = useRef((selectedFace ? FACE_QUATERNIONS[selectedFace] : OPENING_QUATERNION).clone());
  const displayQuaternion = useRef(new THREE.Quaternion());
  const idleQuaternion = useRef(new THREE.Quaternion());
  const idleEuler = useRef(new THREE.Euler());
  const idleElapsed = useRef(0);
  const introStarted = useRef(false);
  const introElapsed = useRef(0);
  const introDone = useRef(false);
  const { gl, invalidate } = useThree();

  const bodyGeometry = useMemo(() => new RoundedBoxGeometry(0.94, 0.94, 0.94, 5, 0.095), []);
  const stickerGeometry = useMemo(() => new RoundedBoxGeometry(0.78, 0.78, 0.048, 5, 0.068), []);
  const labelGeometry = useMemo(() => new THREE.PlaneGeometry(0.6, 0.6), []);
  const bodyMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: "#060708",
    roughness: 0.2,
    metalness: 0.36,
    clearcoat: 0.72,
    clearcoatRoughness: 0.16,
  }), []);
  const stickerMaterials = useMemo(() => Object.fromEntries(faceOrder.map((faceId) => [
    faceId,
    new THREE.MeshPhysicalMaterial({
      color: faces[faceId].color,
      roughness: 0.22,
      metalness: 0.02,
      clearcoat: 0.62,
      clearcoatRoughness: 0.14,
    }),
  ])) as Record<FaceId, THREE.MeshPhysicalMaterial>, []);
  const labelMaterials = useMemo(() => Object.fromEntries(faceOrder.map((faceId) => {
    const dark = faceId === "strategy" || faceId === "story";
    return [faceId, new THREE.MeshBasicMaterial({ map: makeLabelTexture(faces[faceId].code, dark), transparent: true, toneMapped: false })];
  })) as Record<FaceId, THREE.MeshBasicMaterial>, []);

  useEffect(() => {
    const target = selectedFace ? FACE_QUATERNIONS[selectedFace] : previewFace ? FACE_QUATERNIONS[previewFace] : OPENING_QUATERNION;
    targetQuaternion.current.copy(target);
    if (reduceMotion && rootRef.current) rootRef.current.quaternion.copy(target);
    invalidate();
  }, [invalidate, previewFace, reduceMotion, selectedFace]);

  useEffect(() => {
    if (resetSignal === 0) return;
    activeMove.current = null;
    queuedMoves.current = [];
    gesture.current = null;
    moveHistory.current = [];
    const solved = createSolvedCubies();
    cubiesRef.current.forEach((cubie, index) => {
      cubie.position = [...solved[index].position];
      cubie.quaternion.identity();
      const group = cubieRefs.current.get(cubie.id);
      if (group) {
        group.position.set(...cubie.position).multiplyScalar(CUBIE_STEP);
        group.quaternion.identity();
      }
    });
    targetQuaternion.current.copy(OPENING_QUATERNION);
    onScrambleChange(false);
    invalidate();
  }, [invalidate, onScrambleChange, resetSignal]);

  const startTurn = (turn: QuarterTurn, notify = true) => {
    if (activeMove.current) return;
    const axisIndex = turn.axis === "x" ? 0 : turn.axis === "y" ? 1 : 2;
    const affected = cubiesRef.current
      .filter((cubie) => cubie.position[axisIndex] === turn.layer)
      .map((cubie) => ({
        cubie,
        position: new THREE.Vector3(...cubie.position).multiplyScalar(CUBIE_STEP),
        quaternion: cubie.quaternion.clone(),
      }));
    activeMove.current = { turn, elapsed: 0, affected };
    moveHistory.current.push(turn.notation);
    if (notify) onScrambleChange(true);
    void validateMoveSequence(moveHistory.current).catch((error) => {
      console.error("Cube move validation failed", error);
    });
    invalidate();
  };

  const resolveSwipe = (currentGesture: Gesture, clientX: number, clientY: number) => {
    const cubie = cubiesRef.current.find((item) => item.id === currentGesture.cubieId);
    if (!cubie || !rootRef.current) return null;
    const swipe = new THREE.Vector2(clientX - currentGesture.x, -(clientY - currentGesture.y));
    if (swipe.length() < SWIPE_THRESHOLD) return null;
    swipe.normalize();

    const normal = new THREE.Vector3(...currentGesture.sticker.normal).applyQuaternion(cubie.quaternion);
    const snappedNormal = snapVector(normal);
    let best: { score: number; turn: QuarterTurn } | null = null;
    for (const axis of PRIMARY_AXES) {
      if (Math.abs(axis.dot(normal)) > 0.1) continue;
      const projected = axis.clone().applyQuaternion(rootRef.current.quaternion);
      const screen = new THREE.Vector2(projected.x, projected.y);
      if (screen.lengthSq() < 0.0001) continue;
      screen.normalize();
      const dot = screen.dot(swipe);
      const tangent = axis.clone().multiplyScalar(dot >= 0 ? 1 : -1);
      const tangentTuple = snapVector(tangent);
      const turn = swipeToTurn(snappedNormal, tangentTuple, cubie.position);
      if (!turn) continue;
      const score = Math.abs(dot);
      if (!best || score > best.score) best = { score, turn };
    }
    return best?.turn ?? null;
  };

  const beginOrbit = (event: ThreeEvent<PointerEvent>) => {
    if (activeMove.current || queuedMoves.current.length) return;
    event.stopPropagation();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    orbitGesture.current = {
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
      pointerId: event.pointerId,
      start: targetQuaternion.current.clone(),
    };
  };

  const updateOrbit = (event: ThreeEvent<PointerEvent>) => {
    const current = orbitGesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.nativeEvent.clientX - current.x;
    const dy = event.nativeEvent.clientY - current.y;
    const yaw = new THREE.Quaternion().setFromAxisAngle(AXIS_VECTORS.y, dx * 0.007);
    const pitch = new THREE.Quaternion().setFromAxisAngle(AXIS_VECTORS.x, dy * 0.007);
    targetQuaternion.current.copy(yaw.multiply(pitch).multiply(current.start));
    invalidate();
  };

  const finishOrbit = (event: ThreeEvent<PointerEvent>) => {
    const current = orbitGesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    event.stopPropagation();
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    orbitGesture.current = null;
  };

  const onStickerDown = (event: ThreeEvent<PointerEvent>, cubie: Cubie, sticker: Sticker) => {
    if (activeMove.current || queuedMoves.current.length) return;
    gesture.current = {
      cubieId: cubie.id,
      sticker,
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
      pointerId: event.pointerId,
      moved: false,
    };
    event.stopPropagation();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };

  const onStickerMove = (event: ThreeEvent<PointerEvent>) => {
    if (orbitGesture.current) {
      updateOrbit(event);
      return;
    }
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId || current.moved || activeMove.current) return;
    const distance = Math.hypot(event.nativeEvent.clientX - current.x, event.nativeEvent.clientY - current.y);
    if (distance < SWIPE_THRESHOLD) return;
    const turn = resolveSwipe(current, event.nativeEvent.clientX, event.nativeEvent.clientY);
    current.moved = true;
    if (turn) startTurn(turn);
  };

  const onStickerUp = (event: ThreeEvent<PointerEvent>) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (orbitGesture.current) {
      if (!current.moved && current.sticker.center) onSelectFace(current.sticker.faceId);
      gesture.current = null;
      finishOrbit(event);
      return;
    }
    event.stopPropagation();
    if (!current.moved && current.sticker.center) {
      onSelectFace(current.sticker.faceId);
    }
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    gesture.current = null;
  };

  useFrame((state, delta) => {
    const root = rootRef.current;
    if (!root) return;
    let animating = false;

    if (scrambleSignal !== lastScrambleSignal.current) {
      lastScrambleSignal.current = scrambleSignal;
      queuedMoves.current = SCRAMBLE_MOVES.map(moveToTurn);
    }

    if (!activeMove.current && queuedMoves.current.length) {
      const nextTurn = queuedMoves.current.shift();
      if (nextTurn) startTurn(nextTurn, false);
      animating = true;
    }

    if (!introStarted.current) {
      introStarted.current = true;
      if (reduceMotion) {
        root.quaternion.copy(targetQuaternion.current);
        root.scale.setScalar(1);
        root.position.y = CUBE_BASE_Y;
        introDone.current = true;
      } else {
        root.quaternion.copy(OPENING_QUATERNION).multiply(ENTRANCE_OFFSET);
        root.scale.setScalar(0.82);
        root.position.y = CUBE_BASE_Y;
      }
    }
    if (!introDone.current) {
      introElapsed.current += delta;
      const progress = Math.min(introElapsed.current / 0.65, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      root.quaternion.slerp(targetQuaternion.current, 0.12 + eased * 0.12);
      root.scale.setScalar(0.82 + eased * 0.18);
      introDone.current = progress >= 1;
      animating = !introDone.current || !reduceMotion;
    } else {
      const idleActive = !reduceMotion
        && !selectedFace
        && !orbitGesture.current
        && !gesture.current
        && !activeMove.current
        && queuedMoves.current.length === 0;
      const displayTarget = displayQuaternion.current.copy(targetQuaternion.current);
      if (idleActive) {
        idleElapsed.current += delta;
        idleEuler.current.set(
          Math.sin(idleElapsed.current * 0.58) * 0.03,
          Math.sin(idleElapsed.current * 0.42) * 0.085,
          Math.sin(idleElapsed.current * 0.35) * 0.012,
        );
        displayTarget.multiply(idleQuaternion.current.setFromEuler(idleEuler.current));
        root.position.y = CUBE_BASE_Y + Math.sin(idleElapsed.current * 0.72) * 0.035;
        animating = true;
      } else {
        root.position.y += (CUBE_BASE_Y - root.position.y) * (1 - Math.exp(-delta * 8));
      }
      const angle = root.quaternion.angleTo(displayTarget);
      if (angle > 0.001) {
        root.quaternion.slerp(displayTarget, 1 - Math.exp(-delta * 11));
        animating = true;
      } else {
        root.quaternion.copy(displayTarget);
      }
    }

    const move = activeMove.current;
    if (move) {
      move.elapsed += delta;
      const progress = Math.min(move.elapsed / (reduceMotion ? 0.01 : MOVE_DURATION), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const turnQuaternion = new THREE.Quaternion().setFromAxisAngle(
        AXIS_VECTORS[move.turn.axis],
        move.turn.direction * Math.PI * 0.5 * eased,
      );
      for (const item of move.affected) {
        const group = cubieRefs.current.get(item.cubie.id);
        if (!group) continue;
        group.position.copy(item.position).applyQuaternion(turnQuaternion);
        group.quaternion.copy(turnQuaternion).multiply(item.quaternion);
      }
      if (progress >= 1) {
        const finalQuaternion = new THREE.Quaternion().setFromAxisAngle(
          AXIS_VECTORS[move.turn.axis],
          move.turn.direction * Math.PI * 0.5,
        );
        for (const item of move.affected) {
          // Cubie transforms are an imperative Three.js state model, not React render state.
          // eslint-disable-next-line react-hooks/immutability
          item.cubie.position = rotateTuple(item.cubie.position, move.turn.axis, move.turn.direction);
          item.cubie.quaternion.copy(finalQuaternion).multiply(item.quaternion).normalize();
          const group = cubieRefs.current.get(item.cubie.id);
          if (group) {
            group.position.set(...item.cubie.position).multiplyScalar(CUBIE_STEP);
            group.quaternion.copy(item.cubie.quaternion);
          }
        }
        activeMove.current = null;
      } else {
        animating = true;
      }
    }

    if (animating || orbitGesture.current || queuedMoves.current.length) state.invalidate();
  });

  return (
    <>
      <group ref={rootRef}>
        {cubies.map((cubie) => (
          <group
            key={cubie.id}
            ref={(group) => {
              if (group) cubieRefs.current.set(cubie.id, group);
              else cubieRefs.current.delete(cubie.id);
            }}
            position={cubie.position.map((value) => value * CUBIE_STEP) as Vector3Tuple}
          >
            <mesh geometry={bodyGeometry} material={bodyMaterial} castShadow receiveShadow />
            {cubie.stickers.map((sticker) => {
              const position = sticker.normal.map((value) => value * 0.493) as Vector3Tuple;
              return (
                <group
                  key={sticker.faceId}
                  position={position}
                  rotation={stickerRotation(sticker.normal)}
                  onPointerOver={() => {
                    gl.domElement.style.cursor = "crosshair";
                  }}
                  onPointerOut={() => {
                    gl.domElement.style.cursor = "grab";
                  }}
                  onPointerDown={(event) => onStickerDown(event, cubie, sticker)}
                  onPointerMove={onStickerMove}
                  onPointerUp={onStickerUp}
                  onPointerCancel={onStickerUp}
                >
                  <mesh
                    geometry={stickerGeometry}
                    material={stickerMaterials[sticker.faceId]}
                    castShadow
                  />
                  {sticker.center && (
                    <mesh position={[0, 0, 0.026]} geometry={labelGeometry} material={labelMaterials[sticker.faceId]} />
                  )}
                </group>
              );
            })}
          </group>
        ))}
      </group>

      <mesh
        position={[0, 0, -3.2]}
        onPointerDown={beginOrbit}
        onPointerMove={updateOrbit}
        onPointerUp={finishOrbit}
        onPointerCancel={finishOrbit}
      >
        <planeGeometry args={[30, 22]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  );
}

function StudioEnvironment() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const previous = scene.environment;
    const previousIntensity = scene.environmentIntensity;
    const pmrem = new THREE.PMREMGenerator(gl);
    const target = pmrem.fromScene(new RoomEnvironment(), 0.035);
    // Three.js owns this imperative renderer state outside React's render model.
    // eslint-disable-next-line react-hooks/immutability
    scene.environment = target.texture;
    scene.environmentIntensity = 0.64;
    return () => {
      scene.environment = previous;
      scene.environmentIntensity = previousIntensity;
      target.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  return null;
}

function ProductLights({ mobile }: { mobile: boolean }) {
  return (
    <>
      <hemisphereLight color="#eef2f8" groundColor="#08090b" intensity={0.82} />
      <directionalLight
        castShadow
        position={[5.5, 7.5, 8]}
        intensity={3.25}
        color="#ffffff"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.00015}
        shadow-normalBias={0.025}
        shadow-radius={mobile ? 2 : 4}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <directionalLight position={[-5, 3, 4]} intensity={1.35} color="#b8c7e8" />
      <directionalLight position={[2, -3, -5]} intensity={0.82} color="#f0c6ae" />
      <mesh position={[0, -2.12, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11, 11]} />
        <shadowMaterial transparent opacity={0.46} />
      </mesh>
      <mesh position={[0, 2.8, -7]}>
        <planeGeometry args={[30, 14]} />
        <meshBasicMaterial color="#0f141b" toneMapped={false} />
      </mesh>
      {[-5.2, 0, 5.2].map((x, index) => (
        <mesh key={x} position={[x, 2.8, -6.98]}>
          <planeGeometry args={[5, 13.4]} />
          <meshBasicMaterial color={index === 1 ? "#111923" : "#121a22"} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

function CameraZoom({ mobile, zoom }: { mobile: boolean; zoom: number }) {
  const { camera, invalidate } = useThree();
  const targetZ = (mobile ? 14.2 : 8.65) / zoom;

  useEffect(() => {
    invalidate();
  }, [invalidate, targetZ]);

  useFrame((state, delta) => {
    const distance = Math.abs(camera.position.z - targetZ);
    if (distance < 0.002) return;
    const nextZ = distance < 0.01 ? targetZ : THREE.MathUtils.damp(camera.position.z, targetZ, 11, delta);
    // The R3F camera is imperative Three.js renderer state.
    // eslint-disable-next-line react-hooks/immutability
    camera.position.z = nextZ;
    if (nextZ !== targetZ) state.invalidate();
  });

  return null;
}

function CubeCanvasFallback() {
  return (
    <div className="cube-loading-object" aria-hidden="true">
      {Array.from({ length: 9 }, (_, index) => <span key={index} />)}
    </div>
  );
}

export function CubeStage(props: CubeStageProps) {
  const [mobile, setMobile] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px), (pointer: coarse)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setMobile(query.matches);
      setReduceMotion(motionQuery.matches);
    };
    update();
    query.addEventListener("change", update);
    motionQuery.addEventListener("change", update);
    return () => {
      query.removeEventListener("change", update);
      motionQuery.removeEventListener("change", update);
    };
  }, []);

  return (
    <Canvas
      aria-label="Interactive portfolio cube"
      camera={{ position: [0, 0, mobile ? 14.2 : 8.65], fov: mobile ? 42 : 38, near: 0.1, far: 50 }}
      dpr={mobile ? [1, 1.5] : [1, 1.75]}
      frameloop="demand"
      shadows
      fallback={<CubeCanvasFallback />}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.94;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      <color attach="background" args={["#0d1116"]} />
      <fog attach="fog" args={["#0d1116", mobile ? 13 : 8, mobile ? 30 : 22]} />
      <StudioEnvironment />
      <ProductLights mobile={mobile} />
      <CameraZoom mobile={mobile} zoom={props.zoom} />
      <CubeObject {...props} reduceMotion={reduceMotion} />
    </Canvas>
  );
}
