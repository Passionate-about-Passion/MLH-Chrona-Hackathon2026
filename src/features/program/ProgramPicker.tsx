"use client";
/**
 * Start screen: for now only BWL, 1st semester (the only program with a real module catalogue).
 * Chosen once, then remembered in localStorage: the next visit of / goes straight to the app.
 */
import "@/components/timetable/timetable.css";
import "@/styles/glass.css";
import { useEffect } from "react";
import { getProgram } from "@/data";

const CHOICE = { program: "bwl", term: 1 };
const KEY = "tt-program";
const href = (c: { program: string; term: number }) => `/?program=${c.program}&term=${c.term}`;

export function ProgramPicker() {
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (saved?.program && getProgram(saved.program)) location.replace(href(saved));
    } catch {
      // no storage (private mode): just show the picker
    }
  }, []);

  const choose = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(CHOICE));
    } catch {
      // ignore, the link still works
    }
  };

  const data = getProgram(CHOICE.program)!;
  const courses = data.courses.filter((c) => c.term === CHOICE.term);

  return (
    <div className="tt-root" lang="de">
      <div className="tt-phone" style={{ overflowY: "auto" }}>
        <section className="tt-plan" aria-label="Studiengang wählen" style={{ position: "static", paddingBottom: 32 }}>
          <div className="tt-plan-head" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
            <h1 className="tt-h1">Dein Stundenplan</h1>
            <p className="tt-sub">Gemma kennt alle Module, Gruppen und Räume deines Semesters.</p>
          </div>
          <div className="tt-course glass-dense" style={{ flexDirection: "column", alignItems: "stretch" }}>
            <div className="tt-course-main">
              <p className="tt-course-name">{data.program?.name ?? "BWL"} · 1. Semester</p>
              <ul className="tt-course-groups" style={{ marginTop: 6 }}>
                {courses.map((c) => (
                  <li key={c.id}>
                    <span className="tt-dot" aria-hidden="true" />
                    {c.name}
                  </li>
                ))}
              </ul>
            </div>
            <a
              href={href(CHOICE)}
              onClick={choose}
              className="tt-btn tt-btn-primary"
              style={{ display: "inline-grid", placeItems: "center", textDecoration: "none" }}
            >
              Los geht&apos;s
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
