/**
 * BEISPIELDATEN – alle Kurse, Gruppen, Räume und Termine sind erfunden.
 * Sie dienen nur dem Mockup und stammen aus keiner echten Universität.
 */
import type { Course, Entry, Group, Kind, Session } from "@/types";

/** The mockup pretends it is Friday 23 Oct 2026, 09:00. */
export const SAMPLE_TODAY = "2026-10-23";
export const SAMPLE_NOW = "09:00";
export const SAMPLE_RANGE = { min: "2026-04-01", max: "2027-03-31" };

export const sampleCourses: Course[] = [
  { id: "c-math", name: "Mathematik I", weight: 5 },
  { id: "c-prog", name: "Programmieren", weight: 4 },
  { id: "c-stat", name: "Statistik", weight: 3 },
  { id: "c-bwl", name: "BWL Grundlagen", weight: 2 },
];

const group = (id: string, courseId: string, kind: Kind, name: string): Group => ({ id, courseId, kind, name });

export const sampleGroups: Group[] = [
  group("g-math-v", "c-math", "V", "Vorlesung"),
  group("g-math-u1", "c-math", "U", "Übung 1"),
  group("g-math-u2", "c-math", "U", "Übung 2"),
  group("g-math-u3", "c-math", "U", "Übung 3"),
  group("g-math-u4", "c-math", "U", "Übung 4"),
  group("g-math-t1", "c-math", "T", "Tutorium"),
  group("g-prog-v", "c-prog", "V", "Vorlesung"),
  group("g-prog-u1", "c-prog", "U", "Übung"),
  group("g-prog-t1", "c-prog", "T", "Tutorium 1"),
  group("g-prog-t2", "c-prog", "T", "Tutorium 2"),
  group("g-prog-t3", "c-prog", "T", "Tutorium 3"),
  group("g-stat-v", "c-stat", "V", "Vorlesung"),
  group("g-stat-u1", "c-stat", "U", "Übung 1"),
  group("g-stat-u2", "c-stat", "U", "Übung 2"),
  group("g-bwl-v", "c-bwl", "V", "Vorlesung"),
];

const session = (groupId: string, wd: number, start: string, end: string, location: string): Session => ({
  id: `s-${groupId}`,
  groupId,
  wd,
  start,
  end,
  location,
  recurring: true,
});

export const sampleSessions: Session[] = [
  session("g-math-v", 0, "10:00", "12:00", "Hörsaal A"),
  session("g-math-u1", 1, "14:00", "16:00", "Raum B 2.14"),
  session("g-math-u2", 3, "14:00", "16:00", "Raum B 2.16"),
  session("g-math-u3", 4, "08:00", "10:00", "Raum B 2.14"),
  session("g-math-u4", 0, "16:00", "18:00", "Raum B 1.08"),
  session("g-math-t1", 2, "16:00", "18:00", "Raum C 0.05"),
  session("g-prog-v", 2, "10:00", "12:00", "Hörsaal 3"),
  session("g-prog-u1", 2, "14:00", "16:00", "PC-Pool 1"),
  session("g-prog-t1", 4, "11:00", "13:00", "PC-Pool 1"),
  session("g-prog-t2", 0, "14:00", "16:00", "PC-Pool 2"),
  session("g-prog-t3", 3, "16:00", "18:00", "PC-Pool 1"),
  session("g-stat-v", 4, "10:00", "12:00", "Hörsaal 1"),
  session("g-stat-u1", 1, "10:00", "12:00", "Raum 2.03"),
  session("g-stat-u2", 0, "16:00", "18:00", "Raum 2.03"),
  session("g-bwl-v", 1, "08:00", "10:00", "Hörsaal 2"),
];

/** The groups the student currently attends. */
const chosenGroupIds = [
  "g-math-v",
  "g-math-u2",
  "g-math-t1",
  "g-prog-v",
  "g-prog-u1",
  "g-prog-t1",
  "g-stat-v",
  "g-stat-u1",
  "g-bwl-v",
];

function entryFor(groupId: string): Entry {
  const g = sampleGroups.find((x) => x.id === groupId)!;
  const c = sampleCourses.find((x) => x.id === g.courseId)!;
  const s = sampleSessions.find((x) => x.groupId === groupId)!;
  return {
    id: `e-${g.id}`,
    title: `${c.name} ${g.name}`,
    type: g.kind,
    start: s.start,
    end: s.end,
    location: s.location,
    weight: c.weight,
    recurring: s.recurring,
    fixed: false,
    wd: s.wd,
    date: s.date,
    courseId: c.id,
    groupId: g.id,
  };
}

export const sampleEntries: Entry[] = [
  ...chosenGroupIds.map(entryFor),
  {
    id: "p-climb",
    title: "Klettern",
    type: "P",
    start: "18:00",
    end: "20:00",
    location: "Boulderhalle",
    weight: 3,
    recurring: true,
    fixed: true,
    wd: 0,
  },
  {
    id: "p-run",
    title: "Lauftreff",
    type: "P",
    start: "18:00",
    end: "19:00",
    location: "Stadtpark",
    weight: 2,
    recurring: true,
    fixed: false,
    wd: 2,
  },
];
