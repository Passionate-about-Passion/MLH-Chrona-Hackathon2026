import type { Course, Entry, Group } from "@/types";
import type { ReactNode } from "react";

interface LearnplanProps {
  /** e.g. "BWL (B.Sc.) · 1. Semester" */
  title: string;
  courses: Course[];
  groups: Group[];
  entries: Entry[];
  onExport: () => void;
  onChangeProgram: () => void;
  /** Google calendar connect button / sync status, shown between title and .ics */
  google?: ReactNode;
  /** content of the plan, e.g. the study-time table */
  summary?: ReactNode;
}

/** The plan is the study-time table (`summary`); the per-course list of sessions was removed on purpose. */
export function Learnplan({ title, onExport, onChangeProgram, google, summary }: LearnplanProps) {
  return (
    <section className="tt-plan" aria-label="Lernplan">
      <div className="tt-plan-head">
        <h1 className="tt-h1">Lernplan</h1>
        {google}
        <button type="button" className="tt-btn tt-btn-glass glass" onClick={onExport}>
          .ics
        </button>
      </div>
      <div className="tt-plan-program">
        <span>{title}</span>
        <button type="button" className="tt-link-btn" onClick={onChangeProgram}>
          Ändern
        </button>
      </div>
      <ul className="tt-courses">
        {summary && <li style={{ listStyle: "none" }}>{summary}</li>}
      </ul>
    </section>
  );
}
