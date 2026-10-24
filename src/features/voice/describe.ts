// Antworttext zum Vorlesen – gebaut aus Plan + Daten, nicht von Gemma (nichts wird erfunden).
// Nur type-Imports, damit `node describe.check.ts` ohne Build läuft.
import type { Constraint, CourseData, Day, Plan } from "../../lib/types";

const NAMES: Record<Day, string> = {
  Mo: "Montag", Di: "Dienstag", Mi: "Mittwoch", Do: "Donnerstag", Fr: "Freitag", Sa: "Samstag", So: "Sonntag",
};
const ORDER = Object.keys(NAMES) as Day[];

type Item = { start: string; end: string; text: string };

/** "14:30" → "14 Uhr 30", "10:00" → "10 Uhr" (withUhr=false → "10") */
function clock(t: string, withUhr = true): string {
  const [h, m] = t.split(":").map(Number);
  return m ? `${h} Uhr ${m}` : withUhr ? `${h} Uhr` : `${h}`;
}

/** "von 10 bis 12 Uhr", "von 14 Uhr 30 bis 16 Uhr" */
function range(start: string, end: string): string {
  const full = !start.endsWith(":30") && start.endsWith(":00") && end.endsWith(":00");
  return full ? `von ${clock(start, false)} bis ${clock(end)}` : `von ${clock(start)} bis ${clock(end)}`;
}

function list(parts: string[]): string {
  return parts.length < 2 ? parts.join("") : `${parts.slice(0, -1).join(", ")} und ${parts[parts.length - 1]}`;
}

function itemsOf(data: CourseData, plan: Plan, constraints: Constraint[]): Record<Day, Item[]> {
  const days = Object.fromEntries(ORDER.map((d) => [d, [] as Item[]])) as Record<Day, Item[]>;
  for (const c of plan.chosen) {
    const course = data.courses.find((x) => x.id === c.courseId);
    const group = course?.groups.find((g) => g.id === c.groupId);
    if (!course || !group) continue;
    for (const s of group.sessions) {
      const where = !s.room ? ""
        : /^[A-Z]{1,2} ?\d/.test(s.room) ? ` in Raum ${s.room}`
        : s.room === "Aula" ? " in der Aula" : ` im ${s.room}`;
      days[s.day].push({ start: s.start, end: s.end, text: `${course.name}, ${group.kind}${where}` });
    }
  }
  for (const f of [...data.fixed, ...constraints.filter((c) => c.hard)]) {
    days[f.day].push({ start: f.start, end: f.end, text: f.label });
  }
  for (const d of ORDER) days[d].sort((a, b) => a.start.localeCompare(b.start));
  return days;
}

export function describeSchedule(
  data: CourseData,
  plan: Plan,
  day: Day | "week",
  constraints: Constraint[] = [],
): string {
  const days = itemsOf(data, plan, constraints);
  const say = (d: Day) => days[d].map((i) => `${range(i.start, i.end)} ${i.text}`);

  if (day !== "week") {
    const n = days[day].length;
    if (!n) return `Am ${NAMES[day]} hast du frei.`;
    return `Am ${NAMES[day]} hast du ${n} ${n === 1 ? "Termin" : "Termine"}: ${list(say(day))}.`;
  }

  const busy = ORDER.filter((d) => days[d].length);
  const free = ORDER.slice(0, 5).filter((d) => !days[d].length);
  const out = busy.map((d) => `${NAMES[d]}: ${list(say(d))}.`);
  if (free.length) out.push(`${list(free.map((d) => NAMES[d]))} hast du frei.`);
  return out.join(" ");
}

/** "Di 14:00–16:00" → "Dienstag 14 Uhr" (mehrere Termine mit "und") */
function spoken(s: string): string {
  const hits = [...s.matchAll(/(Mo|Di|Mi|Do|Fr|Sa|So) (\d\d:\d\d)/g)];
  return hits.length ? list(hits.map((h) => `${NAMES[h[1] as Day]} ${clock(h[2])}`)) : s;
}

export function describeChanges(data: CourseData, plan: Plan): string {
  const parts: string[] = [];
  if (plan.changes.length) {
    const n = plan.changes.length;
    const moves = plan.changes.map((c) => {
      const name = data.courses.find((x) => x.id === c.courseId)?.name ?? c.courseId;
      return `${name} ${c.kind} von ${spoken(c.from)} auf ${spoken(c.to)}`;
    });
    parts.push(`Ich habe ${n} ${n === 1 ? "Termin" : "Termine"} verschoben: ${list(moves)}.`);
  }
  if (plan.dropped.length) {
    const names = plan.dropped.map((id) => data.courses.find((x) => x.id === id)?.name ?? id);
    parts.push(`Nicht mehr im Plan: ${list(names)}.`);
  }
  const times = (c: string) =>
    c.replace(/(Mo|Di|Mi|Do|Fr|Sa|So) (\d\d:\d\d)–(\d\d:\d\d)/g, (_, d, a, b) => `${NAMES[d as Day]} ${range(a, b)}`);
  parts.push(...plan.conflicts.map((c) => (/[.!?]$/.test(c) ? times(c) : `${times(c)}.`)));
  return parts.length ? parts.join(" ") : "Dein Plan passt schon, nichts zu ändern.";
}
