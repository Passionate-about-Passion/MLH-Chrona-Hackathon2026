/**
 * Study time per exam, derived from the module catalogue (ECTS) and the chosen groups (contact hours).
 * Assumption (Bologna): 1 ECTS = 30 h total workload. Self-study = workload − contact time.
 */
import type { CourseData } from "@/lib/types";
import type { Entry } from "@/types";

export const HOURS_PER_ECTS = 30;

export interface StudyRow {
  id: string;
  code: string;
  name: string;
  ects: number;
  /** total workload in hours */
  total: number;
  /** contact hours over the semester (lectures, exercises, tutorials in the plan) */
  contact: number;
  /** self-study hours over the semester */
  self: number;
  /** self-study hours per lecture week */
  perWeek: number;
  /** share of all self-study, 0–1 */
  share: number;
}

const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** lecture weeks between semester start and end (fallback 14) */
export function semesterWeeks(data: CourseData): number {
  const s = data.semester;
  if (!s) return 14;
  const days = (Date.parse(s.end) - Date.parse(s.start)) / 86_400_000;
  return Math.max(1, Math.round(days / 7));
}

export function studyTime(data: CourseData, entries: Entry[]): { rows: StudyRow[]; weeks: number; total: StudyRow } {
  const weeks = semesterWeeks(data);
  const rows = data.courses
    .filter((c) => c.exam)
    .map((c) => {
      const weekly = entries
        .filter((e) => e.courseId === c.id)
        .reduce((h, e) => h + (minutes(e.end) - minutes(e.start)) / 60, 0);
      const total = c.ects * HOURS_PER_ECTS;
      const contact = Math.min(total, Math.round(weekly * weeks));
      const self = total - contact;
      const [code, ...rest] = c.name.split(" · ");
      return {
        id: c.id,
        code: rest.length ? code : "",
        name: rest.length ? rest.join(" · ") : c.name,
        ects: c.ects,
        total,
        contact,
        self,
        perWeek: Math.round((self / weeks) * 10) / 10,
        share: 0,
      };
    })
    .sort((a, b) => b.self - a.self);

  const sum = rows.reduce((n, r) => n + r.self, 0) || 1;
  for (const r of rows) r.share = r.self / sum;

  const total: StudyRow = {
    id: "total",
    code: "",
    name: "Gesamt",
    ects: rows.reduce((n, r) => n + r.ects, 0),
    total: rows.reduce((n, r) => n + r.total, 0),
    contact: rows.reduce((n, r) => n + r.contact, 0),
    self: rows.reduce((n, r) => n + r.self, 0),
    perWeek: Math.round((rows.reduce((n, r) => n + r.self, 0) / weeks) * 10) / 10,
    share: 1,
  };
  return { rows, weeks, total };
}
