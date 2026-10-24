"use client";
/**
 * Start screen: choose study program + semester once (default BWL, 1st semester – the demo case).
 * The choice is remembered in localStorage: the next visit of / goes straight to the app. /?reset shows the picker again.
 */
import "@/components/timetable/timetable.css";
import "@/styles/glass.css";
import { useEffect, useState } from "react";
import { PROGRAMS, getProgram } from "@/data";

const KEY = "tt-program-v2";
const DEFAULT = { program: "bwl", term: 1 };
const href = (c: { program: string; term?: number }) => `/?program=${c.program}${c.term ? `&term=${c.term}` : ""}`;

/** default program first, the internal demo data last */
const ORDER = Object.keys(PROGRAMS).sort((a, b) => Number(b === DEFAULT.program) - Number(a === DEFAULT.program) || Number(a === "demo") - Number(b === "demo"));

/** standard length of study: offered even where the data only covers some semesters (BWL: only the 1st so far) */
const SEMESTERS: Record<string, number> = { bwl: 6 };

const termsOf = (id: string) => {
  const fromData = PROGRAMS[id].courses.flatMap((c) => (c.term != null ? [c.term] : []));
  const all = Array.from({ length: SEMESTERS[id] ?? 0 }, (_, i) => i + 1);
  return [...new Set([...fromData, ...all])].sort((a, b) => a - b);
};

const selectStyle = {
  minHeight: 48,
  padding: "0 14px",
  borderRadius: 14,
  border: "1px solid rgba(29, 29, 31, 0.14)",
  background: "rgba(255, 255, 255, 0.9)",
  fontSize: 16,
  fontWeight: 500,
  color: "var(--ink)",
} as const;

export function ProgramPicker() {
  const [program, setProgram] = useState(DEFAULT.program);
  const [term, setTerm] = useState(DEFAULT.term);
  const terms = termsOf(program);

  useEffect(() => {
    try {
      if (new URLSearchParams(location.search).has("reset")) return localStorage.removeItem(KEY);
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (saved?.program && getProgram(saved.program)) location.replace(href(saved));
    } catch {
      // no storage (private mode): just show the picker
    }
  }, []);

  const pickProgram = (id: string) => {
    setProgram(id);
    const t = termsOf(id);
    if (!t.includes(term)) setTerm(t[0] ?? 1);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const choice = { program, term: terms.length ? term : undefined };
    try {
      localStorage.setItem(KEY, JSON.stringify(choice));
    } catch {
      // ignore, navigation still works
    }
    location.assign(href(choice));
  };

  return (
    <div className="tt-root" lang="de">
      <div className="tt-phone" style={{ display: "grid", placeItems: "center", padding: 20 }}>
        <form className="tt-panel glass-dense" onSubmit={submit} style={{ width: "100%" }}>
          <h1 className="tt-h1">Willkommen</h1>
          <p className="tt-sub">Wähle einmal deinen Studiengang und dein Semester.</p>
          <div className="tt-form">
            <label className="tt-field">
              Studiengang
              <select value={program} onChange={(e) => pickProgram(e.target.value)} style={selectStyle}>
                {ORDER.map((id) => (
                  <option key={id} value={id}>
                    {PROGRAMS[id].program?.name ?? id}
                  </option>
                ))}
              </select>
            </label>
            {terms.length > 0 && (
              <label className="tt-field">
                Semester
                <select value={term} onChange={(e) => setTerm(Number(e.target.value))} style={selectStyle}>
                  {terms.map((t) => (
                    <option key={t} value={t}>
                      {t}. Semester
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button type="submit" className="tt-btn tt-btn-primary" style={{ marginTop: 8 }}>
              Weiter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
