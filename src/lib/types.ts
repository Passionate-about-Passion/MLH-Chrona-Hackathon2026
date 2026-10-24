/**
 * THE CONTRACT between the 4 slices. Agree on this at 11:30, then everyone builds against it.
 * Change it only after telling the team (it breaks other slices).
 *
 *  Slice A  Erfassen   (capture)    → produces: image + note        → POST /api/analyze
 *  Slice B  Verstehen  (understand) → produces: Analysis            ← /api/analyze
 *  Slice C  Handeln    (act)        → consumes Analysis + Action    → POST /api/act → ActResult
 *  Slice D  Sprechen   (voice)      → consumes any text             → POST /api/speak → audio/mpeg
 */

export interface Action {
  id: string;
  /** Button label shown to the user, e.g. "Antwort entwerfen" */
  label: string;
  /** What /api/act should do, e.g. "draft_reply" | "explain_simple" | "find_deadline" */
  type: string;
}

export interface Analysis {
  title: string;
  summary: string;
  keyPoints: string[];
  /** ISO dates or human text, e.g. "2026-11-07" */
  deadlines: string[];
  actions: Action[];
  /** BCP-47 language of the source, e.g. "de" */
  language: string;
}

export interface ActResult {
  actionId: string;
  text: string;
  /** Optional sources when Google Search grounding was used */
  sources?: { title: string; url: string }[];
}

export interface Meta {
  provider: string;
  model: string;
  ms: number;
  mock?: boolean;
}

export type ApiError = { error: string };

/* ───────── Stundenplan (docs/backend.md) ───────── */

export type Day = "Mo" | "Di" | "Mi" | "Do" | "Fr" | "Sa" | "So";
export type GroupKind = "Vorlesung" | "Übung" | "Tutorium";

/** One weekly slot, times as "HH:MM" */
export interface Session {
  day: Day;
  start: string;
  end: string;
  room?: string;
}

/** Pick exactly one group per kind of a course */
export interface Group {
  id: string;
  kind: GroupKind;
  sessions: Session[];
}

export interface Course {
  id: string;
  name: string;
  required: boolean;
  ects: number;
  exam: boolean;
  groups: Group[];
}

/** Time the student is not available. hard = fixed appointment, soft = wish ("Dienstag frei") */
export interface Constraint {
  type: "block";
  day: Day;
  start: string;
  end: string;
  label: string;
  hard: boolean;
}

/** 3 = very important. Set by Gemma from course data + what the student said */
export interface Priority {
  courseId: string;
  weight: 1 | 2 | 3;
  reason: string;
}

/** Gemma asks back when a sentence can mean several things */
export interface Question {
  question: string;
  options: string[];
}

/** POST /api/analyze → what Gemma understood */
export interface Understanding {
  intent: "reschedule" | "query";
  transcript: string;
  constraints: Constraint[];
  priorities: Priority[];
  questions: Question[];
  /** intent "query": which day to read out, or the whole week */
  queryDay?: Day | "week";
}

export interface Choice {
  courseId: string;
  groupId: string;
}

/** POST /api/act → the new timetable */
export interface Plan {
  chosen: Choice[];
  /** courseIds that had to give way (least important first) */
  dropped: string[];
  /** human-readable problems, e.g. "Mathe-Vorlesung liegt nur dienstags" */
  conflicts: string[];
  alternatives: (Choice & { reason: string })[];
  /** e.g. { from: "Di 10:00–12:00", to: "Do 08:00–10:00" } */
  changes: { courseId: string; kind: GroupKind; from: string; to: string }[];
}

export interface CourseData {
  courses: Course[];
  /** private appointments / hobbies known from the start */
  fixed: Constraint[];
  /** lecture period as ISO dates, used for the calendar export (weekly events until end) */
  semester?: { start: string; end: string };
}
