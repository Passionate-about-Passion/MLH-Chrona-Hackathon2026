/** Data model of the timetable mockup. Weekdays are 0 = Monday … 6 = Sunday, dates are ISO yyyy-mm-dd, times are "HH:MM". */

export type Kind = "V" | "U" | "T";
/** V = Vorlesung, U = Übung, T = Tutorium, P = privat */
export type EntryType = Kind | "P";

export interface Course {
  id: string;
  name: string;
  /** importance 1–5 */
  weight: number;
}

export interface Group {
  id: string;
  courseId: string;
  kind: Kind;
  name: string;
}

export interface Session {
  id: string;
  groupId: string;
  /** weekday for recurring sessions */
  wd?: number;
  /** date for one-off sessions */
  date?: string;
  start: string;
  end: string;
  location: string;
  recurring: boolean;
}

/** One block in the calendar (derived from a chosen session or created by the user). */
export interface Entry {
  id: string;
  title: string;
  type: EntryType;
  start: string;
  end: string;
  location: string;
  weight: number;
  recurring: boolean;
  /** fixed entries cannot be moved */
  fixed: boolean;
  wd?: number;
  date?: string;
  courseId?: string;
  groupId?: string;
}
