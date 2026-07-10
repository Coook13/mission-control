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

const solved: Vector3Tuple[] = [];
for (const x of [-1, 0, 1]) {
  for (const y of [-1, 0, 1]) {
    for (const z of [-1, 0, 1]) {
      if (x || y || z) solved.push([x, y, z]);
    }
  }
}

describe("cube move model", () => {
  it("maps all legal outer moves in both directions", () => {
    const moves: CubeMove[] = ["R", "R'", "L", "L'", "U", "U'", "D", "D'", "F", "F'", "B", "B'"];
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

  it("rejects swipes that would turn a middle slice", () => {
    expect(swipeToTurn([0, 0, 1], [0, 1, 0], [0, 1, 1])).toBeNull();
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
});
