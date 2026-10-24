/**
 * Thin adapter between the team backend (src/lib/types.ts, /api/act) and the timetable UI (src/types.ts).
 * The backend Plan is the only source of truth; UI entries are derived from it on every render.
 */
import type { Choice, Constraint, Course as BCourse, CourseData, Day, GroupKind, Plan, Priority } from "@/lib/types";
import type { Course, Entry, EntryType, Group, Kind, Session } from "@/types";
import type { Alternative } from "@/components/timetable/logic";

export const DAYS: Day[] = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const KIND: Record<GroupKind, Kind> = { Vorlesung: "V", Übung: "U", Tutorium: "T" };

/** Backend weights are 1-3, the UI shows 1-5. */
export const toUiWeight = (w: number) => (w >= 3 ? 5 : w === 2 ? 3 : 1);
export const toBackendWeight = (w: number): 1 | 2 | 3 => (w >= 4 ? 3 : w === 3 ? 2 : 1);

/** Same default as /api/analyze: required + exam = 3, required = 2, elective = 1 */
const defaultWeight = (c: BCourse): 1 | 2 | 3 => (c.required ? (c.exam ? 3 : 2) : 1);

export const weightOf = (c: BCourse, priorities: Priority[]) =>
  priorities.find((p) => p.courseId === c.id)?.weight ?? defaultWeight(c);

/** Full priority list for /api/act, so the solver and the UI use the same weights. */
export const fullPriorities = (data: CourseData, priorities: Priority[]): Priority[] =>
  data.courses.map(
    (c) => priorities.find((p) => p.courseId === c.id) ?? { courseId: c.id, weight: defaultWeight(c), reason: "Standardgewicht" },
  );

/** UI-only details of private appointments (Constraint has no room or importance). */
export type BlockExtras = Record<string, { location?: string; weight?: number; fixed?: boolean }>;
export const blockKey = (c: Pick<Constraint, "day" | "start" | "end" | "label">) => `${c.day}|${c.start}|${c.end}|${c.label}`;

export const uiCourses = (data: CourseData, priorities: Priority[]): Course[] =>
  data.courses.map((c) => ({ id: c.id, name: c.name, weight: toUiWeight(weightOf(c, priorities)) }));

/** "stat-u2" → "Übung 2", "bwl-v" → "Vorlesung" */
const groupName = (g: { id: string; kind: GroupKind }) => {
  const n = g.id.match(/(\d+)$/)?.[1];
  return n ? `${g.kind} ${n}` : g.kind;
};

export const uiGroups = (data: CourseData): Group[] =>
  data.courses.flatMap((c) => c.groups.map((g) => ({ id: g.id, courseId: c.id, kind: KIND[g.kind], name: groupName(g) })));

/** Every session of every chosen group, plus fixed blocks, as weekly calendar entries. */
export function planToEntries(
  data: CourseData,
  plan: Plan,
  constraints: Constraint[],
  priorities: Priority[],
  extras: BlockExtras,
): Entry[] {
  const out: Entry[] = [];
  for (const choice of plan.chosen) {
    const course = data.courses.find((c) => c.id === choice.courseId);
    const group = course?.groups.find((g) => g.id === choice.groupId);
    if (!course || !group) continue;
    group.sessions.forEach((s, i) => {
      out.push({
        id: `${group.id}#${i}`,
        title: `${course.name} ${group.kind}`,
        type: KIND[group.kind] as EntryType,
        start: s.start,
        end: s.end,
        location: s.room ?? "",
        weight: toUiWeight(weightOf(course, priorities)),
        recurring: true,
        fixed: false,
        wd: DAYS.indexOf(s.day),
        courseId: course.id,
        groupId: group.id,
      });
    });
  }
  // wishes ("Dienstag frei") are soft and not drawn as blocks
  for (const b of [...data.fixed, ...constraints].filter((c) => c.hard)) {
    const key = blockKey(b);
    const x = extras[key] ?? {};
    out.push({
      id: `blk:${key}`,
      title: b.label,
      type: "P",
      start: b.start,
      end: b.end,
      location: x.location ?? "",
      weight: x.weight ?? 5,
      recurring: true,
      fixed: x.fixed ?? true,
      wd: DAYS.indexOf(b.day),
    });
  }
  return out;
}

const overlaps = (a: { start: string; end: string }, b: { start: string; end: string }) => a.start < b.end && b.start < a.end;

/**
 * Up to 3 other groups of the same course and kind. The solver's suggestion comes first,
 * then groups that collide with nothing, then the rest.
 */
export function alternativesFor(
  data: CourseData,
  plan: Plan,
  constraints: Constraint[],
  entry: Entry,
  suggestedGroupId?: string,
): Alternative[] {
  const course = data.courses.find((c) => c.id === entry.courseId);
  const own = course?.groups.find((g) => g.id === entry.groupId);
  if (!course || !own) return [];
  const sessionIdx = Number(entry.id.split("#")[1] ?? 0);
  const busy = [
    ...[...data.fixed, ...constraints].filter((c) => c.hard),
    ...plan.chosen
      .filter((c) => !(c.courseId === course.id && c.groupId === own.id))
      .flatMap((c) => data.courses.find((x) => x.id === c.courseId)?.groups.find((g) => g.id === c.groupId)?.sessions ?? []),
  ];
  const free = (sessions: { day: Day; start: string; end: string }[]) =>
    sessions.every((s) => !busy.some((b) => b.day === s.day && overlaps(s, b)));

  return course.groups
    .filter((g) => g.kind === own.kind && g.id !== own.id)
    .map((g) => ({ g, rank: g.id === suggestedGroupId ? 0 : free(g.sessions) ? 1 : 2 }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 3)
    .map(({ g }) => {
      const s = g.sessions[Math.min(sessionIdx, g.sessions.length - 1)];
      const group: Group = { id: g.id, courseId: course.id, kind: KIND[g.kind], name: groupName(g) };
      const session: Session = {
        id: `${g.id}#s`,
        groupId: g.id,
        wd: DAYS.indexOf(s.day),
        start: s.start,
        end: s.end,
        location: s.room ?? "",
        recurring: true,
      };
      return { group, session };
    });
}

/** plan.chosen with the group of the same course and kind swapped. */
export function swapChoice(chosen: Choice[], courseId: string, fromGroupId: string, toGroupId: string): Choice[] {
  return chosen.map((c) => (c.courseId === courseId && c.groupId === fromGroupId ? { courseId, groupId: toGroupId } : c));
}

/* ---------- API calls (routes stay unchanged) ---------- */

export interface ActResponse {
  plan: Plan;
  meta: { mock?: boolean; calendar?: string; calendarStats?: { created: number; deleted: number; kept: number } };
}

/** chosen study program; sent with every plan request */
let selection: { program?: string; term?: number } = {};
export const setSelection = (s: { program?: string; term?: number }) => {
  selection = s;
};

export async function requestPlan(body: {
  constraints?: Constraint[];
  priorities?: Priority[];
  current?: Choice[];
  sync?: boolean;
}): Promise<ActResponse> {
  const res = await fetch("/api/act", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...selection, ...body }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `Planer antwortet mit ${res.status}`);
  return json as ActResponse;
}

/** Short note for toasts, e.g. "Im Google Kalender aktualisiert." */
export function calendarNote(meta: ActResponse["meta"]) {
  if (meta.calendar === "synced") return " Im Google Kalender aktualisiert.";
  if (meta.calendar?.startsWith("error")) return " Google Kalender nicht erreichbar.";
  return "";
}
