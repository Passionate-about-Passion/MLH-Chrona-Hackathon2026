import type { Course, Entry, Group } from "@/types";
import { WD_SHORT, range } from "./logic";

const KIND_NAME = { V: "Vorlesung", U: "Übung", T: "Tutorium" } as const;

interface LearnplanProps {
  /** e.g. "BWL (B.Sc.) · 1. Semester" */
  title: string;
  courses: Course[];
  groups: Group[];
  entries: Entry[];
  /** GET /api/google/status, null while loading or unreachable */
  google: { configured: boolean; connected: boolean } | null;
  onExport: () => void;
  onChangeProgram: () => void;
}

function GoogleSync({ google }: { google: LearnplanProps["google"] }) {
  if (!google) return null;
  return (
    <div className="tt-google glass-dense">
      <div>
        <p className="tt-google-title">Google Kalender</p>
        <p className="tt-google-sub">
          {google.connected
            ? "Verbunden. Jede Änderung landet im Kalender „Stundenplan“."
            : google.configured
              ? "Verbinde dein Konto, dann landet jede Änderung im Kalender."
              : "Noch nicht eingerichtet: Google-Zugang fehlt auf dem Server (docs/backend.md)."}
        </p>
      </div>
      {google.connected ? (
        <span className="tt-google-ok" role="img" aria-label="verbunden">
          ✓
        </span>
      ) : google.configured ? (
        // full navigation: the OAuth flow redirects back to /?google=ok
        <a className="tt-btn tt-btn-primary tt-google-btn" href="/api/google/login">
          Verbinden
        </a>
      ) : (
        <button type="button" className="tt-btn tt-btn-quiet tt-google-btn" disabled>
          Verbinden
        </button>
      )}
    </div>
  );
}

export function Learnplan({ title, courses, groups, entries, google, onExport, onChangeProgram }: LearnplanProps) {
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
        <li>
          <GoogleSync google={google} />
        </li>
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
