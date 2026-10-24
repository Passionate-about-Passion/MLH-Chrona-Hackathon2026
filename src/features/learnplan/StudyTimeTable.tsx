"use client";
/**
 * "Lernzeit pro Klausur": weekly study goal per exam (from ECTS minus contact time), with logging (+1 h / −)
 * and progress for this week and the whole semester. Logged hours live in localStorage (per browser).
 * Uses the timetable's CSS tokens and glass classes (styles: .tt-study* in timetable.css), so it must render inside .tt-root.
 */
import { useEffect, useState } from "react";
import { HOURS_PER_ECTS, type StudyRow } from "./studyTime";

const KEY = "tt-study-log";
const STEP = 1;

type Log = { week: string; done: Record<string, number>; semester: Record<string, number> };

/** Monday of the current week as ISO date – a new week starts the weekly progress at 0 */
function weekKey(d = new Date()) {
  const m = new Date(d);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}-${String(m.getDate()).padStart(2, "0")}`;
}

function load(): Log {
  const empty = { week: weekKey(), done: {}, semester: {} };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Log | null;
    if (!saved) return empty;
    return saved.week === weekKey() ? saved : { ...saved, week: weekKey(), done: {} };
  } catch {
    return empty;
  }
}

const h = (n: number) => `${(Math.round(n * 10) / 10).toLocaleString("de-DE")} h`;

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="tt-study-bar">
      <div className="tt-study-fill" data-done={pct >= 100 || undefined} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** weekly progress ring, like the activity rings in Apple Fitness */
function Ring({ value, max }: { value: number; max: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <svg className="tt-study-ring" viewBox="0 0 96 96" width="96" height="96" aria-hidden="true">
      <circle cx="48" cy="48" r={r} className="tt-study-ring-track" />
      <circle
        cx="48"
        cy="48"
        r={r}
        className="tt-study-ring-fill"
        data-done={pct >= 1 || undefined}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
      />
    </svg>
  );
}

/** weekly goal = self-study + the course's lectures, exercises and tutorials */
const goalOf = (r: StudyRow) => Math.round((r.perWeek + r.contactWeek) * 10) / 10;

export function StudyTimeTable({
  rows,
  weeks,
  total,
  onSchedule,
}: {
  rows: StudyRow[];
  weeks: number;
  total: StudyRow;
  /** put this course's study time into free calendar slots */
  onSchedule?: (courseId: string) => void;
}) {
  const [log, setLog] = useState<Log>({ week: "", done: {}, semester: {} });
  useEffect(() => setLog(load()), []);

  if (!rows.length) return null;

  const add = (id: string, delta: number) => {
    setLog((prev) => {
      const done = Math.max(0, (prev.done[id] ?? 0) + delta);
      const applied = done - (prev.done[id] ?? 0);
      const next: Log = {
        week: prev.week || weekKey(),
        done: { ...prev.done, [id]: done },
        semester: { ...prev.semester, [id]: Math.max(0, (prev.semester[id] ?? 0) + applied) },
      };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // no storage: progress only lasts until reload
      }
      return next;
    });
  };

  // attended sessions count automatically once they are over; logged hours come on top
  const doneOf = (r: StudyRow) => (log.done[r.id] ?? 0) + r.attended;
  const weekGoal = goalOf(total);
  const weekDone = rows.reduce((n, r) => n + Math.min(doneOf(r), goalOf(r)), 0);

  return (
    <div className="tt-study">
      <section className="tt-study-hero glass-dense" style={{ ["--i" as string]: 0 }}>
        <Ring value={weekDone} max={weekGoal} />
        <div className="tt-study-hero-text">
          <p className="tt-study-kicker">Diese Woche</p>
          <p className="tt-study-big">{h(weekDone)}</p>
          <p className="tt-study-sub">
            von {h(weekGoal)} · davon {h(total.attended)} in Veranstaltungen · {weeks} Wochen Semester
          </p>
        </div>
      </section>

      <h2 className="tt-study-h">Lernzeit pro Klausur</h2>
      <ul className="tt-study-list">
        {rows.map((r, i) => {
          const logged = log.done[r.id] ?? 0;
          const done = doneOf(r);
          const goal = goalOf(r);
          const left = Math.max(0, goal - done);
          const sem = log.semester[r.id] ?? 0;
          return (
            <li key={r.id} className="tt-study-card glass-dense" style={{ ["--i" as string]: i + 1 }}>
              <div className="tt-study-head">
                <span className="tt-study-name">{r.name}</span>
                <span className="tt-study-goal">{h(goal)}/Wo</span>
              </div>
              <Bar value={done} max={goal} />
              <p className="tt-study-foot">
                {h(r.attended)} von {h(r.contactWeek)} Veranstaltung besucht · {h(logged)} selbst gelernt
              </p>
              <div className="tt-study-row">
                <span className="tt-study-left" data-done={left <= 0 || undefined}>
                  {left > 0 ? `noch ${h(left)} diese Woche` : "✓ Wochenziel erreicht"}
                </span>
                <button
                  type="button"
                  className="tt-study-btn glass"
                  onClick={() => add(r.id, -STEP)}
                  disabled={logged <= 0}
                  aria-label={`${r.name}: eine Stunde weniger`}
                >
                  −
                </button>
                <button
                  type="button"
                  className="tt-study-btn tt-study-plus glass"
                  onClick={() => add(r.id, STEP)}
                  aria-label={`${r.name}: eine Stunde gelernt`}
                >
                  +1 h
                </button>
              </div>
              {onSchedule && (
                <button type="button" className="tt-study-schedule" onClick={() => onSchedule(r.id)}>
                  Lernzeit in Kalender einplanen
                </button>
              )}
              <p className="tt-study-foot">
                {r.code ? `${r.code} · ` : ""}Semester {h(sem)} / {h(r.self)} selbst
              </p>
            </li>
          );
        })}
      </ul>
      <p className="tt-study-note">
        Annahme: 1 ECTS = {HOURS_PER_ECTS} h Aufwand pro Semester, verteilt auf {weeks} Wochen. Vorlesungen, Übungen und
        Tutorien zählen mit, sobald sie in dieser Woche vorbei sind.
      </p>
    </div>
  );
}
