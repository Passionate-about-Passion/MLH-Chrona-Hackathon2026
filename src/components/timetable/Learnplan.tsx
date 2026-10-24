import type { Course, Entry, Group } from "@/types";
import { WD_SHORT, range } from "./logic";

const KIND_NAME = { V: "Vorlesung", U: "Übung", T: "Tutorium" } as const;

interface LearnplanProps {
  /** e.g. "BWL (B.Sc.) · 1. Semester" */
  title: string;
  courses: Course[];
  groups: Group[];
  entries: Entry[];
  onExport: () => void;
  onChangeProgram: () => void;
}

export function Learnplan({ title, courses, groups, entries, onExport, onChangeProgram }: LearnplanProps) {
  return (
    <section className="tt-plan" aria-label="Lernplan">
      <div className="tt-plan-head">
        <h1 className="tt-h1">Lernplan</h1>
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
        {courses.map((c) => {
          const mine = entries.filter((e) => e.courseId === c.id);
          return (
            <li key={c.id} className="tt-course glass-dense">
              <div className="tt-course-main">
                <p className="tt-course-name">{c.name}</p>
                <ul className="tt-course-groups">
                  {mine.map((e) => {
                    const g = groups.find((x) => x.id === e.groupId);
                    return (
                      <li key={e.id} data-type={e.type}>
                        <span className="tt-dot" aria-hidden="true" />
                        {g ? KIND_NAME[g.kind] : e.title} · {WD_SHORT[e.wd ?? 0]} {range(e)}
                      </li>
                    );
                  })}
                  {mine.length === 0 && <li>Passt nicht in die Woche</li>}
                </ul>
              </div>
              <p className="tt-course-weight" aria-label={`Wichtigkeit ${c.weight}`}>
                {c.weight}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
