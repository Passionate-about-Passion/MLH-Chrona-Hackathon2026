// Selbsttest ohne Netz: node src/features/act/gcal.check.ts
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { desiredEvents } from "./gcal.ts";
import { solve } from "./solver.ts";
import type { CourseData } from "../../lib/types";

const data = JSON.parse(readFileSync(new URL("../../data/demo.json", import.meta.url), "utf8")) as CourseData;
const start = solve(data, [], []).chosen;
const events = desiredEvents(data, start, []);

const sessions = start.reduce((n, c) => n + (data.courses.find((x) => x.id === c.courseId)!.groups.find((g) => g.id === c.groupId)!.sessions.length), 0);
assert.equal(events.length, sessions + data.fixed.length, "Kurs-Termine + feste Termine");

const matheV = events.find((e) => e.summary === "Mathematik I – Vorlesung" && e.start.dateTime.endsWith("T10:00:00") && e.start.dateTime.startsWith("2026-10-27"));
assert.ok(matheV, "erster Dienstag 2026-10-27 10:00");
assert.ok(events.every((e) => e.recurrence[0] === "RRULE:FREQ=WEEKLY;UNTIL=20270205T225959Z"), "RRULE bis Semesterende");
assert.ok(events.every((e) => /^[a-v0-9]{5,}$/.test(e.id)), "gültige Google-IDs");
assert.deepEqual(desiredEvents(data, start, []).map((e) => e.id), events.map((e) => e.id), "IDs stabil");

const moved = start.map((c) => (c.groupId === "stat-u1" ? { ...c, groupId: "stat-u2" } : c));
const after = new Set(desiredEvents(data, moved, []).map((e) => e.id));
assert.equal(events.filter((e) => !after.has(e.id)).length, 1, "stat-u1 → stat-u2 ändert genau einen Termin");

const withBlock = desiredEvents(data, start, [{ type: "block", day: "Do", start: "14:00", end: "16:00", label: "Fester Termin", hard: true }]);
assert.equal(withBlock.length, events.length + 1, "harter Termin kommt in den Kalender");
assert.equal(desiredEvents(data, start, [{ type: "block", day: "Di", start: "08:00", end: "22:00", label: "Frei", hard: false }]).length, events.length, "Wunsch nicht");

console.log(`gcal.check OK (${events.length} Termine)`);
