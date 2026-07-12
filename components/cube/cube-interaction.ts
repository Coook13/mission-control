import { turnToMove, type Axis, type Direction, type QuarterTurn, type Vector3Tuple } from "./cube-model";

export const TAP_SLOP = 10;
export const TWIST_MIN_DISTANCE = 12;
export const TWIST_HOLD_DURATION = 180;

export type GestureIntent = "pending" | "tap" | "orbit" | "armed" | "twist";

export function classifyGestureIntent({
  distance,
  released,
  armed = false,
  startedOnStage = false,
}: {
  distance: number;
  released: boolean;
  armed?: boolean;
  startedOnStage?: boolean;
}): GestureIntent {
  if (startedOnStage) return distance > TAP_SLOP ? "orbit" : "pending";
  if (armed) return released && distance >= TWIST_MIN_DISTANCE ? "twist" : "armed";
  if (distance > TAP_SLOP) return "orbit";
  if (released && distance <= TAP_SLOP) return "tap";
  return "pending";
}

type Point2 = [number, number];
type ProjectPoint = (point: Vector3Tuple) => Point2;

const AXES: readonly Axis[] = ["x", "y", "z"];
const AXIS_INDEX: Record<Axis, 0 | 1 | 2> = { x: 0, y: 1, z: 2 };

function rotatePoint(point: Vector3Tuple, axis: Axis, direction: Direction): Vector3Tuple {
  const [x, y, z] = point;
  if (axis === "x") return direction === 1 ? [x, -z, y] : [x, z, -y];
  if (axis === "y") return direction === 1 ? [z, y, -x] : [-z, y, x];
  return direction === 1 ? [-y, x, z] : [y, -x, z];
}

export function selectProjectedTurn({
  cubiePosition,
  stickerNormal,
  swipe,
  project,
}: {
  cubiePosition: Vector3Tuple;
  stickerNormal: Vector3Tuple;
  swipe: Point2;
  project: ProjectPoint;
}): QuarterTurn | null {
  const swipeLength = Math.hypot(swipe[0], swipe[1]);
  if (swipeLength === 0) return null;
  const swipeDirection: Point2 = [swipe[0] / swipeLength, swipe[1] / swipeLength];
  const surfacePoint = cubiePosition.map((value, index) => value + stickerNormal[index] * 0.52) as Vector3Tuple;
  const start = project(surfacePoint);
  let best: { score: number; turn: QuarterTurn } | null = null;

  for (const axis of AXES) {
    const axisIndex = AXIS_INDEX[axis];
    if (Math.abs(stickerNormal[axisIndex]) > 0.5) continue;
    const layer = cubiePosition[axisIndex] as -1 | 0 | 1;
    for (const direction of [-1, 1] as const) {
      const end = project(rotatePoint(surfacePoint, axis, direction));
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const length = Math.hypot(dx, dy);
      if (length < 0.0001) continue;
      const score = (dx / length) * swipeDirection[0] + (dy / length) * swipeDirection[1];
      const turn: QuarterTurn = { axis, layer, direction, notation: turnToMove(axis, layer, direction) };
      if (!best || score > best.score) best = { score, turn };
    }
  }

  return best?.turn ?? null;
}
