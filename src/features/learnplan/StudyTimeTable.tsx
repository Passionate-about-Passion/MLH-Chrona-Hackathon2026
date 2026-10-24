"use client";
/**
 * "Lernzeit pro Klausur": weekly study goal per exam (from ECTS minus contact time), with logging (+1 h / −)
 * and progress for this week and the whole semester. Logged hours live in localStorage (per browser).
 * Uses the timetable's CSS tokens (--primary, --ink-2, --line), so it must render inside .tt-root.
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
    <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(29, 29, 31, 0.08)", overflow: "hidden" }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          borderRadius: 4,
          background: pct >= 100 ? "var(--u-bar)" : "var(--primary)",
          transition: "width 0.3s",
        }}
      />
    </div>
  );
}

const stepBtn = {
  minWidth: 44,
  minHeight: 36,
  padding: "0 10px",
  border: 0,
  borderRadius: 18,
  fontWeight: 700,
  fontSize: 14,
} as const;

export function StudyTimeTable({ rows, weeks, total }: { rows: StudyRow[]; weeks: number; total: StudyRow }) {
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

  const weekDone = rows.reduce((n, r) => n + Math.min(log.done[r.id] ?? 0, r.perWeek), 0);

  return (
    <div className="glass-dense" style={{ padding: "14px 16px", borderRadius: 24 }}>
      <p className="tt-course-name" style={{ margin: 0 }}>
        Lernzeit pro Klausur
      </p>
      <p className="tt-sub" style={{ margin: "2px 0 10px", fontSize: 13 }}>
        Wochenziel neben deinen Veranstaltungen · {weeks} Wochen Semester
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
        <span style={{ whiteSpace: "nowrap" }}>Diese Woche</span>
        <Bar value={weekDone} max={total.perWeek} />
        <span style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
          {h(weekDone)} / {h(total.perWeek)}
        </span>
      </div>

      <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0 }}>
        {rows.map((r) => {
          const done = log.done[r.id] ?? 0;
          const left = Math.max(0, r.perWeek - done);
          const sem = log.semester[r.id] ?? 0;
          return (
            <li key={r.id} style={{ padding: "10px 0", borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ flex: 1, minWidth: 0, fontWeight: 650, lineHeight: 1.2 }}>{r.name}</span>
                <span style={{ whiteSpace: "nowrap", fontWeight: 800, color: "var(--primary)" }}>{h(r.perWeek)}/Wo</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                <Bar value={done} max={r.perWeek} />
                <button
                  type="button"
                  style={{ ...stepBtn, background: "rgba(29, 29, 31, 0.07)" }}
                  onClick={() => add(r.id, -STEP)}
                  disabled={done <= 0}
                  aria-label={`${r.name}: eine Stunde weniger`}
                >
                  −
                </button>
                <button
                  type="button"
                  style={{ ...stepBtn, color: "#fff", background: "var(--primary)" }}
                  onClick={() => add(r.id, STEP)}
                  aria-label={`${r.name}: eine Stunde gelernt`}
                >
                  +1 h
                </button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 4, fontSize: 12.5, color: "var(--ink-2)" }}>
                <span>{left > 0 ? `noch ${h(left)} diese Woche` : "✓ Wochenziel erreicht"}</span>
                <span style={{ whiteSpace: "nowrap" }}>
                  {r.code ? `${r.code} · ` : ""}Semester {h(sem)} / {h(r.self)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--ink-2)" }}>
        Annahme: 1 ECTS = {HOURS_PER_ECTS} h Aufwand, abzüglich deiner Vorlesungen, Übungen und Tutorien ({h(total.contact)}),
        verteilt auf {weeks} Wochen.
      </p>
    </div>
  );
}
