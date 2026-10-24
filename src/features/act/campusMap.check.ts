import assert from "node:assert/strict";
import { buildingOf } from "./campusData.ts";

const cases: [string, string | null][] = [
  ["Schloss SO 108", "SO"],
  ["Schloss O 142 (Engelhorn)", "O"],
  ["Schloss O 151 (Hans Luik)", "O"],
  ["B 6 A 001 (Großer Hörsaal)", "B6"],
  ["A 5 C 012", "A5"],
  ["A 5 C -109 (PC-Pool)", "A5"],
  ["B 6 A 301", "B6"],
  ["L 9 1-2", "L9"],
  ["Aula", "O"],
  ["A 101", null],
];
for (const [room, id] of cases) assert.equal(buildingOf(room), id, room);
