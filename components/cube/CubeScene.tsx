"use client";

import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { faceOrder, faces, type FaceId } from "@/lib/site-data";
import {
  FACE_NORMALS,
  moveToTurn,
  rotateTuple,
  validateMoveSequence,
  type Axis,
  type CubeMove,
  type QuarterTurn,
  type Vector3Tuple,
} from "./cube-model";
import { classifyGestureIntent, selectProjectedTurn, TAP_SLOP, type GestureIntent } from "./cube-interaction";

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
  startedAt: number;
  pointerId: number;
  intent: GestureIntent;
};

type OrbitGesture = {
  x: number;
  y: number;
  pointerId: number;
  start: THREE.Quaternion;
  moved: boolean;
};

export type FaceFocusRequest = { faceId: FaceId; requestId: number };

export type CubeStageProps = {
  selectedFace: FaceId | null;
  previewFace: FaceId | null;
  zoom: number;
  focusRequest: FaceFocusRequest | null;
  playIntro: boolean;
  scrambleSignal: number;
  resetSignal: number;
  onSelectFace: (face: FaceId) => void;
  onScrambleChange: (scrambled: boolean) => void;
  onOrbitStart: () => void;
};

type CubeObjectProps = CubeStageProps & { reduceMotion: boolean };

const AXIS_VECTORS: Record<Axis, THREE.Vector3> = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

const OPENING_QUATERNION = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(THREE.MathUtils.degToRad(25), THREE.MathUtils.degToRad(-35), 0, "XYZ"),
);

const FACE_QUATERNIONS: Record<FaceId, THREE.Quaternion> = {
  engineering: new THREE.Quaternion(),
  venture: new THREE.Quaternion().setFromAxisAngle(AXIS_VECTORS.y, -Math.PI / 2),
  strategy: new THREE.Quaternion().setFromAxisAngle(AXIS_VECTORS.x, Math.PI / 2),
  finance: new THREE.Quaternion().setFromAxisAngle(AXIS_VECTORS.y, Math.PI),
  research: new THREE.Quaternion().setFromAxisAngle(AXIS_VECTORS.y, Math.PI / 2),
  story: new THREE.Quaternion().setFromAxisAngle(AXIS_VECTORS.x, -Math.PI / 2),
};

const MOVE_DURATION = 0.34;
const INTRO_DURATION = 2.1;
const CUBIE_STEP = 1.02;
const CUBE_BASE_Y = 0.14;
const DESKTOP_CAMERA_Z = 9.35;
const MOBILE_CAMERA_Z = 15.2;
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
  focusRequest,
  playIntro,
  scrambleSignal,
  resetSignal,
  onSelectFace,
  onScrambleChange,
  onOrbitStart,
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
  const pendingFocus = useRef<FaceId | null>(null);
  const selectionFromCenter = useRef<FaceId | null>(null);
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
  const introBaseQuaternion = useRef(OPENING_QUATERNION.clone());
  const introYaw = useRef(new THREE.Quaternion());
  const introPitch = useRef(new THREE.Quaternion());
  const lastFocusRequest = useRef(focusRequest?.requestId ?? -1);
  const { camera, gl, invalidate } = useThree();

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

  const focusFace = useCallback((faceId: FaceId, notify: boolean) => {
    const root = rootRef.current;
    if (root && !introDone.current) {
      introDone.current = true;
      root.scale.setScalar(1);
    }
    const cubie = cubiesRef.current.find((item) => item.stickers.some((sticker) => sticker.center && sticker.faceId === faceId));
    const sticker = cubie?.stickers.find((item) => item.center && item.faceId === faceId);
    if (root && cubie && sticker) {
      const worldNormal = new THREE.Vector3(...sticker.normal)
        .applyQuaternion(cubie.quaternion)
        .applyQuaternion(root.quaternion)
        .normalize();
      const worldUp = new THREE.Vector3(0, 1, 0)
        .applyEuler(stickerRotation(sticker.normal))
        .applyQuaternion(cubie.quaternion)
        .applyQuaternion(root.quaternion)
        .normalize();
      const focusRotation = new THREE.Quaternion().setFromUnitVectors(worldNormal, AXIS_VECTORS.z);
      const focusedUp = worldUp.applyQuaternion(focusRotation);
      const roll = new THREE.Quaternion().setFromAxisAngle(
        AXIS_VECTORS.z,
        Math.atan2(focusedUp.x, focusedUp.y),
      );
      targetQuaternion.current.copy(roll.multiply(focusRotation).multiply(root.quaternion)).normalize();
      if (reduceMotion) root.quaternion.copy(targetQuaternion.current);
    }
    selectionFromCenter.current = faceId;
    if (notify) onSelectFace(faceId);
    invalidate();
  }, [invalidate, onSelectFace, reduceMotion]);

  useEffect(() => {
    if (selectedFace && selectionFromCenter.current === selectedFace) {
      selectionFromCenter.current = null;
      invalidate();
      return;
    }
    selectionFromCenter.current = null;
    const target = selectedFace ? FACE_QUATERNIONS[selectedFace] : previewFace ? FACE_QUATERNIONS[previewFace] : OPENING_QUATERNION;
    targetQuaternion.current.copy(target);
    if (reduceMotion && rootRef.current) rootRef.current.quaternion.copy(target);
    invalidate();
  }, [invalidate, previewFace, reduceMotion, selectedFace]);

  useEffect(() => {
    if (!focusRequest || focusRequest.requestId === lastFocusRequest.current) return;
    lastFocusRequest.current = focusRequest.requestId;
    if (activeMove.current || queuedMoves.current.length) {
      queuedMoves.current = [];
      pendingFocus.current = focusRequest.faceId;
      invalidate();
    } else {
      focusFace(focusRequest.faceId, false);
    }
  }, [focusFace, focusRequest, invalidate]);

  useEffect(() => {
    if (!playIntro) return;
    introStarted.current = false;
    introElapsed.current = 0;
    introDone.current = false;
    invalidate();
  }, [invalidate, playIntro]);

  useEffect(() => {
    if (resetSignal === 0) return;
    activeMove.current = null;
    queuedMoves.current = [];
    gesture.current = null;
    orbitGesture.current = null;
    pendingFocus.current = null;
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
    selectionFromCenter.current = null;
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
    const root = rootRef.current;
    if (!cubie || !root) return null;
    const normal = new THREE.Vector3(...currentGesture.sticker.normal).applyQuaternion(cubie.quaternion);
    const snappedNormal = snapVector(normal);
    return selectProjectedTurn({
      cubiePosition: cubie.position,
      stickerNormal: snappedNormal,
      swipe: [clientX - currentGesture.x, -(clientY - currentGesture.y)],
      project: (point) => {
        const projected = new THREE.Vector3(...point)
          .multiplyScalar(CUBIE_STEP * root.scale.x)
          .applyQuaternion(root.quaternion)
          .add(root.position)
          .project(camera);
        return [projected.x, projected.y];
      },
    });
  };

  const cancelIntro = () => {
    const root = rootRef.current;
    if (!root || introDone.current) return;
    introDone.current = true;
    targetQuaternion.current.copy(root.quaternion);
    root.scale.setScalar(1);
  };

  const beginOrbit = (event: ThreeEvent<PointerEvent>) => {
    if (activeMove.current || queuedMoves.current.length) return;
    cancelIntro();
    event.stopPropagation();
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    orbitGesture.current = {
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
      pointerId: event.pointerId,
      start: targetQuaternion.current.clone(),
      moved: false,
    };
  };

  const updateOrbit = (event: ThreeEvent<PointerEvent>) => {
    const current = orbitGesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.nativeEvent.clientX - current.x;
    const dy = event.nativeEvent.clientY - current.y;
    if (!current.moved && Math.hypot(dx, dy) > TAP_SLOP) {
      current.moved = true;
      onOrbitStart();
    }
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

  const beginStickerOrbit = (current: Gesture) => {
    cancelIntro();
    current.intent = "orbit";
    orbitGesture.current = {
      x: current.x,
      y: current.y,
      pointerId: current.pointerId,
      start: targetQuaternion.current.clone(),
      moved: false,
    };
  };

  const onStickerDown = (event: ThreeEvent<PointerEvent>, cubie: Cubie, sticker: Sticker) => {
    if (activeMove.current || queuedMoves.current.length) return;
    cancelIntro();
    gesture.current = {
      cubieId: cubie.id,
      sticker,
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
      startedAt: event.nativeEvent.timeStamp,
      pointerId: event.pointerId,
      intent: "pending",
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
    if (!current || current.pointerId !== event.pointerId || activeMove.current) return;
    const distance = Math.hypot(event.nativeEvent.clientX - current.x, event.nativeEvent.clientY - current.y);
    const duration = event.nativeEvent.timeStamp - current.startedAt;
    const intent = classifyGestureIntent({ distance, duration, released: false });
    if (intent === "orbit") {
      beginStickerOrbit(current);
      updateOrbit(event);
    }
  };

  const onStickerUp = (event: ThreeEvent<PointerEvent>) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (orbitGesture.current) {
      updateOrbit(event);
      gesture.current = null;
      finishOrbit(event);
      return;
    }
    event.stopPropagation();
    const distance = Math.hypot(event.nativeEvent.clientX - current.x, event.nativeEvent.clientY - current.y);
    const duration = event.nativeEvent.timeStamp - current.startedAt;
    const intent = classifyGestureIntent({ distance, duration, released: true });
    if (intent === "flick") {
      const turn = resolveSwipe(current, event.nativeEvent.clientX, event.nativeEvent.clientY);
      if (turn) startTurn(turn);
    } else if (intent === "tap" && current.sticker.center) {
      focusFace(current.sticker.faceId, true);
    } else if (intent === "orbit") {
      beginStickerOrbit(current);
      updateOrbit(event);
      orbitGesture.current = null;
    }
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    gesture.current = null;
  };

  const onStickerCancel = (event: ThreeEvent<PointerEvent>) => {
    if (gesture.current?.pointerId !== event.pointerId) return;
    event.stopPropagation();
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    gesture.current = null;
    orbitGesture.current = null;
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

    if (!activeMove.current && queuedMoves.current.length === 0 && pendingFocus.current) {
      const face = pendingFocus.current;
      pendingFocus.current = null;
      focusFace(face, false);
      animating = true;
    }

    if (!introStarted.current) {
      introStarted.current = true;
      if (reduceMotion || !playIntro) {
        root.quaternion.copy(targetQuaternion.current);
        root.scale.setScalar(1);
        root.position.y = CUBE_BASE_Y;
        introDone.current = true;
      } else {
        introBaseQuaternion.current.copy(targetQuaternion.current);
        root.quaternion.copy(introBaseQuaternion.current);
        root.scale.setScalar(0.9);
        root.position.y = CUBE_BASE_Y;
      }
    }
    if (!introDone.current) {
      introElapsed.current += Math.min(delta, 1 / 30);
      const progress = Math.min(introElapsed.current / INTRO_DURATION, 1);
      const eased = progress * progress * (3 - 2 * progress);
      introYaw.current.setFromAxisAngle(AXIS_VECTORS.y, eased * Math.PI * 2);
      introPitch.current.setFromAxisAngle(AXIS_VECTORS.x, Math.sin(eased * Math.PI * 2) * 0.48);
      root.quaternion.copy(introYaw.current).multiply(introPitch.current).multiply(introBaseQuaternion.current);
      root.scale.setScalar(0.9 + Math.min(progress / 0.22, 1) * 0.1);
      introDone.current = progress >= 1;
      if (introDone.current) root.quaternion.copy(targetQuaternion.current);
      animating = !introDone.current;
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
      move.elapsed += Math.min(delta, 1 / 30);
      const progress = Math.min(move.elapsed / (reduceMotion ? 0.01 : MOVE_DURATION), 1);
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
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

    if (animating || orbitGesture.current || queuedMoves.current.length || pendingFocus.current) state.invalidate();
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
                  onPointerCancel={onStickerCancel}
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
  const targetZ = (mobile ? MOBILE_CAMERA_Z : DESKTOP_CAMERA_Z) / zoom;

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
      camera={{ position: [0, 0, mobile ? MOBILE_CAMERA_Z : DESKTOP_CAMERA_Z], fov: mobile ? 42 : 38, near: 0.1, far: 50 }}
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
