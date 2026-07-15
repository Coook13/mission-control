import { describe, expect, it } from "vitest";
import { faceOrder, parseFaceQuery } from "@/lib/site-data";
import {
  applyTurnToPositions,
  inverseMove,
  moveToTurn,
  rotateTuple,
  swipeToTurn,
  turnToMove,
  validateMoveSequence,
  type CubeMove,
  type Vector3Tuple,
} from "./cube-model";
import { classifyGestureIntent, selectProjectedTurn } from "./cube-interaction";

const solved: Vector3Tuple[] = [];
for (const x of [-1, 0, 1]) {
  for (const y of [-1, 0, 1]) {
    for (const z of [-1, 0, 1]) {
      if (x || y || z) solved.push([x, y, z]);
    }
  }
}

describe("cube move model", () => {
  it("maps all legal outer and slice moves in both directions", () => {
    const moves: CubeMove[] = [
      "R", "R'", "L", "L'", "U", "U'", "D", "D'", "F", "F'", "B", "B'",
      "M", "M'", "E", "E'", "S", "S'",
    ];
    for (const move of moves) {
      const turn = moveToTurn(move);
      expect(turnToMove(turn.axis, turn.layer, turn.direction)).toBe(move);
    }
  });

  it("returns every cubie to its solved position after four quarter turns", () => {
    let positions = solved;
    const turn = moveToTurn("R");
    for (let i = 0; i < 4; i += 1) positions = applyTurnToPositions(positions, turn);
    expect(positions).toEqual(solved);
  });

  it("returns to solved state after a move and its inverse", () => {
    const sequence: CubeMove[] = ["R", "U", "F'", "L", "D'", "B"];
    let positions = solved;
    for (const move of sequence) positions = applyTurnToPositions(positions, moveToTurn(move));
    for (const move of [...sequence].reverse()) positions = applyTurnToPositions(positions, moveToTurn(inverseMove(move)));
    expect(positions).toEqual(solved);
  });

  it("keeps center cubies on the same face axis", () => {
    expect(rotateTuple([1, 0, 0], "x", 1)).toEqual([1, 0, 0]);
    expect(rotateTuple([0, 1, 0], "y", -1)).toEqual([0, 1, 0]);
    expect(rotateTuple([0, 0, -1], "z", 1)).toEqual([0, 0, -1]);
  });

  it("maps a front-face horizontal swipe on the upper row to U prime", () => {
    expect(swipeToTurn([0, 0, 1], [1, 0, 0], [0, 1, 1])?.notation).toBe("U'");
  });

  it("maps swipes across each middle slice", () => {
    expect(swipeToTurn([0, 0, 1], [0, 1, 0], [0, 1, 1])?.notation).toBe("M'");
    expect(swipeToTurn([0, 0, 1], [1, 0, 0], [0, 0, 1])?.notation).toBe("E");
    expect(swipeToTurn([1, 0, 0], [0, 1, 0], [1, 0, 0])?.notation).toBe("S'");
  });

  it("returns a middle slice to solved after a move and its inverse", () => {
    const moved = applyTurnToPositions(solved, moveToTurn("M"));
    expect(applyTurnToPositions(moved, moveToTurn("M'"))).toEqual(solved);
  });

  it("accepts only known face query values", () => {
    for (const face of faceOrder) expect(parseFaceQuery(face)).toBe(face);
    expect(parseFaceQuery("markets")).toBeNull();
    expect(parseFaceQuery(undefined)).toBeNull();
  });

  it("validates a 20-move scramble with cubing KPuzzle", async () => {
    const scramble: CubeMove[] = ["R", "U", "F'", "L", "D'", "B", "R'", "U'", "F", "L'", "D", "B'", "R", "F", "U'", "L", "B", "D'", "R'", "F'"];
    const transformation = await validateMoveSequence(scramble);
    expect(transformation.isIdentityTransformation()).toBe(false);
  });

  it("validates middle-slice notation with cubing KPuzzle", async () => {
    const transformation = await validateMoveSequence(["M", "E'", "S"]);
    expect(transformation.isIdentityTransformation()).toBe(false);
  });
});

describe("cube interaction", () => {
  it("keeps every unarmed press pending until it moves, regardless of hold time", () => {
    expect(classifyGestureIntent({ distance: 0, released: false })).toBe("pending");
    expect(classifyGestureIntent({ distance: 4, released: true })).toBe("tap");
    expect(classifyGestureIntent({ distance: 6, released: false })).toBe("orbit");
    expect(classifyGestureIntent({ distance: 18, released: false })).toBe("orbit");
  });

  it("taps or twists directly when a gesture starts on a sticker", () => {
    expect(classifyGestureIntent({ distance: 0, released: false, startedOnSticker: true })).toBe("sticker");
    expect(classifyGestureIntent({ distance: 0, released: true, startedOnSticker: true })).toBe("tap");
    expect(classifyGestureIntent({ distance: 22, released: true, startedOnSticker: true })).toBe("twist");
  });

  it("keeps a drifting center press as a tap while preserving deliberate center swipes", () => {
    expect(classifyGestureIntent({
      distance: 22,
      released: true,
      startedOnSticker: true,
      startedOnCenter: true,
    })).toBe("tap");
    expect(classifyGestureIntent({
      distance: 28,
      released: true,
      startedOnSticker: true,
      startedOnCenter: true,
    })).toBe("twist");
  });

  it("moves the finger-following outer slice instead of the projected axis", () => {
    const turn = selectProjectedTurn({
      cubiePosition: [1, 0, 1],
      stickerNormal: [1, 0, 0],
      swipe: [0, 1],
      project: ([x, y]) => [x, y],
    });
    expect(turn?.axis).toBe("z");
    expect(turn?.layer).toBe(1);
  });

  it("selects a middle slice only when that finger-following band is central", () => {
    const turn = selectProjectedTurn({
      cubiePosition: [1, 0, 1],
      stickerNormal: [0, 0, 1],
      swipe: [1, 0],
      project: ([x, y]) => [x, y],
    });
    expect(turn?.axis).toBe("y");
    expect(turn?.layer).toBe(0);
  });

  it("always chooses a layer containing the touched cubie", () => {
    const position: Vector3Tuple = [-1, 1, 0];
    const turn = selectProjectedTurn({
      cubiePosition: position,
      stickerNormal: [0, 1, 0],
      swipe: [-0.8, 0.2],
      project: ([x, y, z]) => [x * 0.8 + z * 0.5, y],
    });
    const axisIndex = turn?.axis === "x" ? 0 : turn?.axis === "y" ? 1 : 2;
    expect(turn).not.toBeNull();
    expect(position[axisIndex]).toBe(turn?.layer);
  });
});
