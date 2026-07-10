"use client";

import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { faceOrder, faces, type FaceId } from "@/lib/site-data";
import {
  FACE_NORMALS,
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
  startedAt: number;
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
const SWIPE_THRESHOLD = 16;
const TAP_THRESHOLD = 7;

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
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.clearRect(0, 0, 512, 512);
  context.fillStyle = dark ? "#121212" : "#ffffff";
  context.font = `${code.length > 3 ? 700 : 800} ${code.length > 3 ? 92 : 126}px Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(code, 256, 264);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
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

function CubeObject({ selectedFace, previewFace, resetSignal, onSelectFace, onScrambleChange, reduceMotion }: CubeObjectProps) {
  const rootRef = useRef<THREE.Group>(null);
  const cubieRefs = useRef(new Map<string, THREE.Group>());
  const cubies = useMemo(() => createSolvedCubies(), []);
  const cubiesRef = useRef(cubies);
  const activeMove = useRef<ActiveMove | null>(null);
  const moveHistory = useRef<CubeMove[]>([]);
  const gesture = useRef<Gesture | null>(null);
  const orbitGesture = useRef<OrbitGesture | null>(null);
  const targetQuaternion = useRef((selectedFace ? FACE_QUATERNIONS[selectedFace] : OPENING_QUATERNION).clone());
  const introStart = useRef<number | null>(null);
  const introDone = useRef(false);
  const { invalidate } = useThree();

  const bodyGeometry = useMemo(() => new RoundedBoxGeometry(0.94, 0.94, 0.94, 3, 0.105), []);
  const stickerGeometry = useMemo(() => new RoundedBoxGeometry(0.78, 0.78, 0.048, 3, 0.075), []);
  const labelGeometry = useMemo(() => new THREE.PlaneGeometry(0.6, 0.6), []);
  const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#121212", roughness: 0.42, metalness: 0.16 }), []);
  const stickerMaterials = useMemo(() => Object.fromEntries(faceOrder.map((faceId) => [
    faceId,
    new THREE.MeshStandardMaterial({ color: faces[faceId].color, roughness: 0.28, metalness: 0.04 }),
  ])) as Record<FaceId, THREE.MeshStandardMaterial>, []);
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

  const startTurn = (turn: QuarterTurn) => {
    if (activeMove.current) return;
    const axisIndex = turn.axis === "x" ? 0 : turn.axis === "y" ? 1 : 2;
    const affected = cubiesRef.current
      .filter((cubie) => cubie.position[axisIndex] === turn.layer)
      .map((cubie) => ({
        cubie,
        position: new THREE.Vector3(...cubie.position).multiplyScalar(CUBIE_STEP),
        quaternion: cubie.quaternion.clone(),
      }));
    activeMove.current = { turn, startedAt: performance.now() / 1000, affected };
    moveHistory.current.push(turn.notation);
    onScrambleChange(true);
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
    let best: { score: number; tangent: Vector3Tuple; turn: QuarterTurn } | null = null;
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
      if (!best || score > best.score) best = { score, tangent: tangentTuple, turn };
    }
    return best?.turn ?? null;
  };

  const onStickerDown = (event: ThreeEvent<PointerEvent>, cubie: Cubie, sticker: Sticker) => {
    if (activeMove.current) return;
    event.stopPropagation();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    gesture.current = {
      cubieId: cubie.id,
      sticker,
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
      pointerId: event.pointerId,
      moved: false,
    };
  };

  const onStickerMove = (event: ThreeEvent<PointerEvent>) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId || current.moved || activeMove.current) return;
    const turn = resolveSwipe(current, event.nativeEvent.clientX, event.nativeEvent.clientY);
    if (!turn) return;
    current.moved = true;
    startTurn(turn);
  };

  const onStickerUp = (event: ThreeEvent<PointerEvent>) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    event.stopPropagation();
    const distance = Math.hypot(event.nativeEvent.clientX - current.x, event.nativeEvent.clientY - current.y);
    if (!current.moved && distance <= TAP_THRESHOLD && current.sticker.center) {
      onSelectFace(current.sticker.faceId);
    }
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    gesture.current = null;
  };

  const onOrbitDown = (event: ThreeEvent<PointerEvent>) => {
    if (activeMove.current) return;
    event.stopPropagation();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    orbitGesture.current = {
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
      pointerId: event.pointerId,
      start: targetQuaternion.current.clone(),
    };
  };

  const onOrbitMove = (event: ThreeEvent<PointerEvent>) => {
    const current = orbitGesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.nativeEvent.clientX - current.x;
    const dy = event.nativeEvent.clientY - current.y;
    const yaw = new THREE.Quaternion().setFromAxisAngle(AXIS_VECTORS.y, dx * 0.007);
    const pitch = new THREE.Quaternion().setFromAxisAngle(AXIS_VECTORS.x, dy * 0.007);
    targetQuaternion.current.copy(yaw.multiply(pitch).multiply(current.start));
    invalidate();
  };

  const onOrbitUp = (event: ThreeEvent<PointerEvent>) => {
    const current = orbitGesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    event.stopPropagation();
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    orbitGesture.current = null;
  };

  useFrame((state, delta) => {
    const root = rootRef.current;
    if (!root) return;
    const now = performance.now() / 1000;
    let animating = false;

    if (introStart.current === null) {
      introStart.current = now;
      if (reduceMotion) {
        root.quaternion.copy(targetQuaternion.current);
        root.scale.setScalar(1);
        introDone.current = true;
      } else {
        root.quaternion.copy(OPENING_QUATERNION).multiply(ENTRANCE_OFFSET);
        root.scale.setScalar(0.82);
      }
    }
    if (!introDone.current) {
      const progress = Math.min((now - introStart.current) / 0.65, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      root.quaternion.slerp(targetQuaternion.current, 0.12 + eased * 0.12);
      root.scale.setScalar(0.82 + eased * 0.18);
      introDone.current = progress >= 1;
      animating = !introDone.current;
    } else {
      const angle = root.quaternion.angleTo(targetQuaternion.current);
      if (angle > 0.001) {
        root.quaternion.slerp(targetQuaternion.current, 1 - Math.exp(-delta * 11));
        animating = true;
      } else {
        root.quaternion.copy(targetQuaternion.current);
      }
    }

    const move = activeMove.current;
    if (move) {
      const progress = Math.min((now - move.startedAt) / (reduceMotion ? 0.01 : MOVE_DURATION), 1);
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

    if (animating || orbitGesture.current) state.invalidate();
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
                <group key={sticker.faceId} position={position} rotation={stickerRotation(sticker.normal)}>
                  <mesh
                    geometry={stickerGeometry}
                    material={stickerMaterials[sticker.faceId]}
                    castShadow
                    onPointerDown={(event) => onStickerDown(event, cubie, sticker)}
                    onPointerMove={onStickerMove}
                    onPointerUp={onStickerUp}
                    onPointerCancel={onStickerUp}
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
        onPointerDown={onOrbitDown}
        onPointerMove={onOrbitMove}
        onPointerUp={onOrbitUp}
        onPointerCancel={onOrbitUp}
      >
        <planeGeometry args={[30, 22]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  );
}

function ProductLights({ mobile }: { mobile: boolean }) {
  return (
    <>
      <ambientLight intensity={1.65} />
      <directionalLight
        castShadow={!mobile}
        position={[4.5, 6.5, 8]}
        intensity={3.8}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={20}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <directionalLight position={[-5, 2, 5]} intensity={1.5} color="#dfe7ff" />
      <directionalLight position={[0, -4, 3]} intensity={0.75} color="#ffffff" />
      {!mobile && (
        <mesh position={[0, -1.88, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[12, 12]} />
          <shadowMaterial transparent opacity={0.14} />
        </mesh>
      )}
    </>
  );
}

export function CubeFallback({ onSelectFace }: Pick<CubeStageProps, "onSelectFace">) {
  return (
    <div className="cube-fallback" aria-label="Portfolio sections">
      {faceOrder.map((faceId) => (
        <button
          key={faceId}
          type="button"
          style={{ "--face-color": faces[faceId].color } as React.CSSProperties}
          onClick={() => onSelectFace(faceId)}
        >
          <span>{faces[faceId].code}</span>
          <small>{faces[faceId].label}</small>
        </button>
      ))}
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
      camera={{ position: [0, 0, mobile ? 11.8 : 7.4], fov: mobile ? 42 : 38, near: 0.1, far: 50 }}
      dpr={mobile ? [1, 1.25] : [1, 1.5]}
      frameloop="demand"
      shadows={!mobile}
      fallback={<CubeFallback onSelectFace={props.onSelectFace} />}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.08;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      <ProductLights mobile={mobile} />
      <CubeObject {...props} reduceMotion={reduceMotion} />
    </Canvas>
  );
}
