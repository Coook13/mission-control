import type { FaceId } from "@/lib/site-data";

export type Axis = "x" | "y" | "z";
export type Vector3Tuple = [number, number, number];
export type Layer = -1 | 0 | 1;
export type Direction = -1 | 1;
export type CubeMove =
  | "R" | "R'" | "L" | "L'"
  | "U" | "U'" | "D" | "D'"
  | "F" | "F'" | "B" | "B'"
  | "M" | "M'" | "E" | "E'" | "S" | "S'";

export type QuarterTurn = {
  axis: Axis;
  layer: Layer;
  direction: Direction;
  notation: CubeMove;
};

export const FACE_NORMALS: Record<FaceId, Vector3Tuple> = {
  engineering: [0, 0, 1],
  venture: [1, 0, 0],
  strategy: [0, 1, 0],
  finance: [0, 0, -1],
  research: [-1, 0, 0],
  story: [0, -1, 0],
};

const AXIS_INDEX: Record<Axis, 0 | 1 | 2> = { x: 0, y: 1, z: 2 };

export function turnToMove(axis: Axis, layer: Layer, direction: Direction): CubeMove {
  if (layer === 0) {
    const base = axis === "x" ? "M" : axis === "y" ? "E" : "S";
    const naturalDirection = axis === "z" ? -1 : 1;
    return `${base}${direction === naturalDirection ? "" : "'"}` as CubeMove;
  }
  const base = axis === "x" ? (layer === 1 ? "R" : "L")
    : axis === "y" ? (layer === 1 ? "U" : "D")
      : layer === 1 ? "F" : "B";
  const prime = layer * direction > 0;
  return `${base}${prime ? "'" : ""}` as CubeMove;
}

export function moveToTurn(move: CubeMove): QuarterTurn {
  const base = move[0];
  const prime = move.endsWith("'");
  const axis: Axis = base === "R" || base === "L" || base === "M" ? "x"
    : base === "U" || base === "D" || base === "E" ? "y" : "z";
  const layer: Layer = base === "M" || base === "E" || base === "S" ? 0
    : base === "R" || base === "U" || base === "F" ? 1 : -1;
  const naturalDirection = layer === 0 ? (axis === "z" ? -1 : 1) : -layer;
  const direction = (prime ? -naturalDirection : naturalDirection) as Direction;
  return { axis, layer, direction, notation: move };
}

export function inverseMove(move: CubeMove): CubeMove {
  return (move.endsWith("'") ? move[0] : `${move}'`) as CubeMove;
}

export function rotateTuple(position: Vector3Tuple, axis: Axis, direction: Direction): Vector3Tuple {
  const [x, y, z] = position;
  const rotated: Vector3Tuple = axis === "x"
    ? (direction === 1 ? [x, -z, y] : [x, z, -y])
    : axis === "y"
      ? (direction === 1 ? [z, y, -x] : [-z, y, x])
      : (direction === 1 ? [-y, x, z] : [y, -x, z]);
  return rotated.map((value) => value === 0 ? 0 : value) as Vector3Tuple;
}

export function applyTurnToPositions(
  positions: readonly Vector3Tuple[],
  turn: Pick<QuarterTurn, "axis" | "layer" | "direction">,
): Vector3Tuple[] {
  const index = AXIS_INDEX[turn.axis];
  return positions.map((position) =>
    position[index] === turn.layer ? rotateTuple(position, turn.axis, turn.direction) : [...position],
  ) as Vector3Tuple[];
}

export function swipeToTurn(
  stickerNormal: Vector3Tuple,
  swipeTangent: Vector3Tuple,
  cubiePosition: Vector3Tuple,
): QuarterTurn | null {
  const [nx, ny, nz] = stickerNormal;
  const [tx, ty, tz] = swipeTangent;
  const cross: Vector3Tuple = [ny * tz - nz * ty, nz * tx - nx * tz, nx * ty - ny * tx];
  const values = cross.map((value) => Math.round(value)) as Vector3Tuple;
  const axisIndex = values.findIndex((value) => value !== 0);
  if (axisIndex < 0) return null;
  const layer = cubiePosition[axisIndex];
  if (Math.abs(layer) > 1) return null;
  const axis = (["x", "y", "z"] as const)[axisIndex];
  const direction = values[axisIndex] as Direction;
  return { axis, layer: layer as Layer, direction, notation: turnToMove(axis, layer as Layer, direction) };
}

let enginePromise: Promise<Awaited<ReturnType<(typeof import("cubing/puzzles"))["cube3x3x3"]["kpuzzle"]>>> | null = null;

export async function validateMoveSequence(moves: readonly CubeMove[]) {
  enginePromise ??= import("cubing/puzzles").then(({ cube3x3x3 }) => cube3x3x3.kpuzzle());
  const engine = await enginePromise;
  return engine.algToTransformation(moves.join(" "));
}
