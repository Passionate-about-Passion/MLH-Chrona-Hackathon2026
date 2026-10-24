import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { solve } from "./solver.ts";
import type { Choice, CourseData } from "../../lib/types";

const data: CourseData = JSON.parse(readFileSync(new URL("../../data/courses.json", import.meta.url), "utf8"));
const ids = (cs: Choice[]) => cs.map((c) => c.groupId).sort();

// (a) Startplan = jeweils erste Gruppen
const a = solve(data, [], []);
assert.equal(a.changes.length, 0);
assert.equal(a.dropped.length, 0);
for (const c of data.courses) for (const k of new Set(c.groups.map((g) => g.kind)))
  assert.ok(a.chosen.some((x) => x.groupId === c.groups.find((g) => g.kind === k)!.id), `${c.id} ${k}`);

// (b) Do 14-16 hart -> nur stat-u1 -> stat-u2
const b = solve(data, [{ type: "block", day: "Do", start: "14:00", end: "16:00", label: "Termin", hard: true }], [], a.chosen);
assert.deepEqual(b.changes.map((c) => c.courseId), ["stat"]);
assert.ok(b.chosen.some((c) => c.groupId === "stat-u2") && !b.chosen.some((c) => c.groupId === "stat-u1"));

// (c) Di frei als Wunsch
const c = solve(data, [{ type: "block", day: "Di", start: "08:00", end: "22:00", label: "frei", hard: false }], [], a.chosen);
assert.ok(c.chosen.some((x) => x.groupId === "mathe1-v"));
assert.ok(c.conflicts.some((t) => t.includes("Mathematik I Vorlesung bleibt Di 10:00–12:00")));
const to = new Set(c.chosen.map((x) => x.groupId));
for (const g of ["mathe1-u2", "prog1-u2", "bwl-t2", "spanisch-2"]) assert.ok(to.has(g), g);
assert.equal(c.changes.length, 4);

// (d) zwei Kurse, harte Überschneidung -> Gewicht 1 fliegt raus
const s = { day: "Mo" as const, start: "10:00", end: "12:00" };
const d = solve(
  { fixed: [], courses: [
    { id: "x", name: "X", required: true, ects: 5, exam: true, groups: [{ id: "x-v", kind: "Vorlesung", sessions: [s] }] },
    { id: "y", name: "Y", required: false, ects: 5, exam: false, groups: [{ id: "y-v", kind: "Vorlesung", sessions: [s] }] },
  ] },
  [], [{ courseId: "x", weight: 3, reason: "" }, { courseId: "y", weight: 1, reason: "" }],
);
assert.deepEqual(ids(d.chosen), ["x-v"]);
assert.deepEqual(d.dropped, ["y"]);
console.log("solver.check OK");
