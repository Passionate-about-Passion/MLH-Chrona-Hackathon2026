// node src/features/voice/describe.check.ts
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { describeChanges, describeSchedule } from "./describe.ts";
import type { CourseData, Plan } from "../../lib/types";

const data = JSON.parse(readFileSync(new URL("../../data/courses.json", import.meta.url), "utf8")) as CourseData;
const plan: Plan = {
  chosen: data.courses.flatMap((c) => {
    const kinds = [...new Set(c.groups.map((g) => g.kind))];
    return kinds.map((k) => ({ courseId: c.id, groupId: c.groups.find((g) => g.kind === k)!.id }));
  }),
  dropped: [], conflicts: [], alternatives: [], changes: [],
};

const di = describeSchedule(data, plan, "Di");
console.log(di);
const pos = ["Mathematik I", "Programmieren I", "Spanisch"].map((n) => di.indexOf(n));
assert.ok(pos.every((p) => p >= 0) && pos[0] < pos[1] && pos[1] < pos[2], "Reihenfolge Di");
assert.ok(/BWL/.test(di) && /Mathematik I, Übung/.test(di) && di.includes("von 10 bis 12 Uhr"));
assert.strictEqual(describeSchedule(data, plan, "Sa"), "Am Samstag hast du frei.");

const week = describeSchedule(data, plan, "week");
console.log(week);
assert.ok(week.includes("Montag:") && week.includes("Fußball"));

assert.strictEqual(describeChanges(data, plan), "Dein Plan passt schon, nichts zu ändern.");
const moved = describeChanges(data, {
  ...plan,
  changes: [{ courseId: "stat", kind: "Übung", from: "Do 14:00–16:00", to: "Fr 12:00–14:00" }],
  conflicts: ["Mathematik I Vorlesung bleibt Di 10:00–12:00 – gibt es nur dann"],
});
console.log(moved);
assert.ok(moved.includes("Ich habe 1 Termin verschoben") && moved.includes("von Donnerstag 14 Uhr auf Freitag 12 Uhr"));
console.log("ok");
