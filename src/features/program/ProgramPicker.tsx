/**
 * Start screen: choose study program + semester. Links to /?program=…&term=…, page.tsx then shows the app
 * with exactly these courses (Gemma and the solver only see the courses of this program).
 */
import "@/components/timetable/timetable.css";
import "@/styles/glass.css";
import { PROGRAMS } from "@/data";

const terms = (id: string) =>
  [...new Set(PROGRAMS[id].courses.flatMap((c) => (c.term != null ? [c.term] : [])))].sort((a, b) => a - b);

export function ProgramPicker() {
  return (
    <div className="tt-root" lang="de">
      <div className="tt-phone" style={{ overflowY: "auto" }}>
        <section className="tt-plan" aria-label="Studiengang wählen" style={{ position: "static", paddingBottom: 32 }}>
          <div className="tt-plan-head" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
            <h1 className="tt-h1">Dein Stundenplan</h1>
            <p className="tt-sub">Wähle Studiengang und Semester. Gemma kennt dann alle Module, Gruppen und Räume.</p>
          </div>
          <ul className="tt-courses" style={{ padding: 0, overflow: "visible" }}>
            {Object.entries(PROGRAMS).map(([id, p]) => (
              <li key={id} className="tt-course glass-dense" style={{ flexDirection: "column", alignItems: "stretch" }}>
                <div className="tt-course-main">
                  <p className="tt-course-name">{p.program?.name ?? id}</p>
                  <p className="tt-sub" style={{ margin: 0 }}>
                    {p.courses.length} Module · {p.courses.reduce((n, c) => n + c.groups.length, 0)} Gruppen
                  </p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(terms(id).length ? terms(id) : [undefined]).map((t) => (
                    <a
                      key={t ?? "all"}
                      href={`/?program=${id}${t != null ? `&term=${t}` : ""}`}
                      className="tt-btn tt-btn-primary"
                      style={{ display: "inline-grid", placeItems: "center", textDecoration: "none" }}
                    >
                      {t != null ? `${t}. Semester` : "Starten"}
                    </a>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
