"use client";
import { useEffect, useState } from "react";

export interface ProgramChoice {
  program: string;
  term: number;
}

interface ProgramInfo {
  id: string;
  name: string;
  terms: number[];
}

/** First screen: pick Studiengang and Fachsemester (data from GET /api/programs). */
export function Onboarding({ onDone }: { onDone: (c: ProgramChoice) => void }) {
  const [programs, setPrograms] = useState<ProgramInfo[]>([]);
  const [error, setError] = useState("");
  const [program, setProgram] = useState("");
  const [term, setTerm] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/programs")
      .then((r) => r.json())
      .then((list: ProgramInfo[]) => setPrograms(list))
      .catch(() => setError("Die Studiengänge konnten nicht geladen werden."));
  }, []);

  const chosen = programs.find((p) => p.id === program);

  return (
    <section className="tt-onboard glass-dense" aria-labelledby="onboard-title">
      <h1 id="onboard-title" className="tt-h1">
        Dein Stundenplan
      </h1>
      <p className="tt-sub">Wähle Studiengang und Semester. Daraus erstelle ich deinen ersten Plan.</p>

      <fieldset className="tt-choice">
        <legend>Studiengang</legend>
        {error && <p className="tt-error">{error}</p>}
        <div className="tt-choice-list" role="radiogroup" aria-label="Studiengang">
        {programs.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={program === p.id}
            className="tt-choice-item"
            onClick={() => {
              setProgram(p.id);
              setTerm(p.terms.length === 1 ? p.terms[0] : null);
            }}
          >
            {p.name}
          </button>
        ))}
        </div>
      </fieldset>

      {chosen && (
        <fieldset className="tt-choice">
          <legend>Fachsemester</legend>
          <div className="tt-terms" role="radiogroup" aria-label="Fachsemester">
            {chosen.terms.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={term === t}
                className="tt-weight-pick"
                onClick={() => setTerm(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <button
        type="button"
        className="tt-btn tt-btn-primary tt-onboard-go"
        disabled={!program || term == null}
        onClick={() => term != null && onDone({ program, term })}
      >
        Stundenplan erstellen
      </button>
    </section>
  );
}
