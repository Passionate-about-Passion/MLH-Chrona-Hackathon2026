import type { CourseData } from "@/lib/types";
import demo from "./demo.json";
import bwl from "./bwl.json";
import wifo from "./wifo.json";
import vwl from "./vwl.json";

/** Neuer Studiengang = Import + eine Zeile hier. */
export const PROGRAMS: Record<string, CourseData> = {
  demo: demo as CourseData,
  bwl: bwl as CourseData,
  wifo: wifo as CourseData,
  vwl: vwl as CourseData,
};

export const getProgram = (id = "demo"): CourseData | undefined => PROGRAMS[id];

/** courseIds gewinnt, sonst alle Kurse des Semesters `term`, sonst alle. */
export function selectCourses(data: CourseData, { term, courseIds }: { term?: number; courseIds?: string[] }): CourseData {
  const courses = courseIds
    ? data.courses.filter((c) => courseIds.includes(c.id))
    : term != null
      ? data.courses.filter((c) => c.term === term)
      : data.courses;
  return { ...data, courses };
}
