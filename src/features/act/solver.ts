/** Wochenplaner: probiert alle Gruppen-Kombinationen durch (Backtracking). Keine KI. */
import type { Choice, Constraint, CourseData, Group, GroupKind, Plan, Priority, Session } from "../../lib/types";

const min = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const hits = (a: { day: string; start: string; end: string }, b: { day: string; start: string; end: string }) =>
  a.day === b.day && min(a.start) < min(b.end) && min(b.start) < min(a.end);
const fmt = (g: Group) => g.sessions.map((s) => `${s.day} ${s.start}–${s.end}`).join(", ");

type Pick = { courseIdx: number; group: Group; groupIdx: number };

export function solve(data: CourseData, constraints: Constraint[], priorities: Priority[], current: Choice[] = []): Plan {
  const blocks = [...data.fixed, ...constraints];
  const hard = blocks.filter((b) => b.hard);
  const soft = blocks.filter((b) => !b.hard);
  const weight = (id: string) => priorities.find((p) => p.courseId === id)?.weight ?? 2;
  const curGroup = (courseId: string, kind: GroupKind) => {
    const course = data.courses.find((c) => c.id === courseId);
    return course?.groups.find((g) => g.kind === kind && current.some((c) => c.courseId === courseId && c.groupId === g.id));
  };

  // Pro Kurs: alle Kombinationen (eine Gruppe je kind) als Option
  const options: Pick[][][] = data.courses.map((course, courseIdx) => {
    const kinds = [...new Set(course.groups.map((g) => g.kind))];
    let combos: Pick[][] = [[]];
    for (const k of kinds) {
      const gs = course.groups.map((group, groupIdx) => ({ courseIdx, group, groupIdx })).filter((p) => p.group.kind === k);
      combos = combos.flatMap((c) => gs.map((p) => [...c, p]));
    }
    return combos;
  });

  type Best = { picks: Pick[]; score: number; changes: number };
  let best: Best | null = null;

  const rec = (ci: number, picks: Pick[], placed: Session[], score: number) => {
    if (ci === data.courses.length) {
      const changes = picks.filter((p) => {
        const c = curGroup(data.courses[p.courseIdx].id, p.group.kind);
        return c && c.id !== p.group.id;
      }).length;
      if (!best || score > best.score || (score === best.score && changes < best.changes)) best = { picks: [...picks], score, changes };
      return;
    }
    // Reihenfolge: erste Gruppen zuerst, "weglassen" zuletzt -> bei Gleichstand gewinnt niedrigerer Index
    for (const combo of options[ci]) {
      const sessions = combo.flatMap((p) => p.group.sessions);
      const ok = sessions.every((s, i) => !hard.some((h) => hits(s, h)) && !placed.some((p) => hits(s, p)) && !sessions.slice(0, i).some((p) => hits(s, p)));
      if (!ok) continue;
      const pen = sessions.filter((s) => soft.some((b) => hits(s, b))).length * 0.5;
      rec(ci + 1, [...picks, ...combo], [...placed, ...sessions], score + weight(data.courses[ci].id) - pen);
    }
    rec(ci + 1, picks, placed, score);
  };
  rec(0, [], [], 0);

  const picks = (best as Best | null)?.picks ?? [];
  const chosen: Choice[] = picks.map((p) => ({ courseId: data.courses[p.courseIdx].id, groupId: p.group.id }));
  const inPlan = new Set(chosen.map((c) => c.courseId));
  const dropped = data.courses.filter((c) => !inPlan.has(c.id)).map((c) => c.id).sort((a, b) => weight(a) - weight(b));

  const changes: Plan["changes"] = [];
  const conflicts: string[] = [];
  const alternatives: Plan["alternatives"] = [];
  const free = (g: Group, others: Group[]) =>
    g.sessions.every((s) => !hard.some((h) => hits(s, h)) && !soft.some((b) => hits(s, b)) && !others.some((o) => o.sessions.some((t) => hits(s, t))));

  for (const p of picks) {
    const course = data.courses[p.courseIdx];
    const old = curGroup(course.id, p.group.kind);
    const others = picks.filter((q) => q !== p).map((q) => q.group);
    if (old && old.id !== p.group.id) {
      changes.push({ courseId: course.id, kind: p.group.kind, from: fmt(old), to: fmt(p.group) });
      for (const g of course.groups) {
        if (g.kind === p.group.kind && g.id !== p.group.id && g.id !== old.id && free(g, others))
          alternatives.push({ courseId: course.id, groupId: g.id, reason: `${course.name} ${g.kind} ${fmt(g)} passt ebenfalls` });
      }
    }
    const hit = p.group.sessions.filter((s) => soft.some((b) => hits(s, b)));
    if (hit.length)
      conflicts.push(`${course.name} ${p.group.kind} bleibt ${hit.map((s) => `${s.day} ${s.start}–${s.end}`).join(", ")} – ${course.groups.filter((g) => g.kind === p.group.kind).length > 1 ? "keine Alternative ohne Überschneidung" : "gibt es nur dann"}`);
  }
  for (const id of dropped) {
    const course = data.courses.find((c) => c.id === id)!;
    conflicts.push(`${course.name} wurde weggelassen – passt nicht in die Woche`);
    for (const g of course.groups) alternatives.push({ courseId: id, groupId: g.id, reason: `${course.name} ${g.kind} ${fmt(g)} (Kurs wurde weggelassen)` });
  }
  return { chosen, dropped, conflicts, alternatives, changes };
}
