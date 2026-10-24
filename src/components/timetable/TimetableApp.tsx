"use client";
import "./timetable.css";
import { useCallback, useMemo, useRef, useState } from "react";
import type { Entry } from "@/types";
import {
  SAMPLE_NOW,
  SAMPLE_RANGE,
  SAMPLE_TODAY,
  sampleCourses,
  sampleEntries,
  sampleGroups,
  sampleSessions,
} from "@/data/sample";
import type { ParsedIntent } from "@/voice";
import { AddSheet } from "./AddSheet";
import { ChangePreview } from "./ChangePreview";
import { ConflictDialog } from "./ConflictDialog";
import { DateSlider, type Mode } from "./DateSlider";
import { DayView } from "./DayView";
import { PinIcon, PlusIcon } from "./Icons";
import { Learnplan } from "./Learnplan";
import { TabBar, type Tab } from "./TabBar";
import { Toast, type ToastState } from "./Toast";
import { VoiceOverlay } from "./VoiceOverlay";
import {
  alternativesFor,
  conflictIds,
  dayParts,
  entriesOn,
  moveToSession,
  nextEntry,
  range,
  relativeDay,
  type Alternative,
} from "./logic";

export function TimetableApp() {
  const [courses, setCourses] = useState(sampleCourses);
  const [entries, setEntries] = useState<Entry[]>(sampleEntries);
  const [tab, setTab] = useState<Tab>("cal");
  const [mode, setMode] = useState<Mode>("W");
  const [date, setDate] = useState(SAMPLE_TODAY);
  const [conflictId, setConflictId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ entryId: string; alt: Alternative } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const counter = useRef(1);

  const showToast = useCallback((message: string, undo?: () => void) => {
    setToast({ id: counter.current++, message, undo });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  const dayEntries = useMemo(() => entriesOn(entries, date), [entries, date]);
  const next = useMemo(() => nextEntry(entries, SAMPLE_TODAY, SAMPLE_NOW), [entries]);
  const parts = dayParts(date);

  const alternativesOf = (e: Entry) => alternativesFor(e, sampleGroups, sampleSessions);

  const openAlternatives = (e: Entry) => {
    if (e.fixed) return showToast("Dieser Termin ist fest und lässt sich nicht verschieben.");
    if (alternativesOf(e).length === 0) return showToast("Für diesen Termin gibt es keine Alternative.");
    setConflictId(e.id);
  };

  const conflictEntry = entries.find((e) => e.id === conflictId);
  const previewEntry = preview && entries.find((e) => e.id === preview.entryId);

  const applyMove = () => {
    if (!preview || !previewEntry) return;
    const course = courses.find((c) => c.id === previewEntry.courseId);
    if (!course) return;
    const before = entries;
    const moved = moveToSession(previewEntry, preview.alt, course);
    setEntries(entries.map((e) => (e.id === moved.id ? moved : e)));
    setPreview(null);
    showToast("Termin verschoben.", () => setEntries(before));
  };

  const addEntry = (data: Omit<Entry, "id">) => {
    const e: Entry = { ...data, id: `p-${counter.current++}` };
    setEntries([...entries, e]);
    if (e.date) setDate(e.date);
    setAddOpen(false);
    showToast("Termin gespeichert.");
  };

  /** Runs only after the user confirmed the card in the voice overlay. */
  const applyIntent = (intent: ParsedIntent) => {
    setVoiceOpen(false);
    if (intent.type === "set_course_weight") {
      setCourses(courses.map((c) => (c.id === intent.courseId ? { ...c, weight: intent.weight } : c)));
      setEntries(entries.map((e) => (e.courseId === intent.courseId ? { ...e, weight: intent.weight } : e)));
      showToast("Wichtigkeit geändert.");
      return;
    }
    if (intent.type !== "block_time") return;
    const block: Entry = {
      id: `p-${counter.current++}`,
      title: intent.title ?? "Fester Termin",
      type: "P",
      start: intent.start,
      end: intent.end,
      location: "",
      weight: 5,
      recurring: false,
      fixed: true,
      date: intent.date,
    };
    const all = [...entries, block];
    setEntries(all);
    setDate(intent.date);
    setTab("cal");
    const day = entriesOn(all, intent.date);
    const bad = conflictIds(day);
    const hit = day.find((e) => bad.has(e.id) && !e.fixed && alternativesOf(e).length > 0);
    if (hit) setConflictId(hit.id);
    else showToast("Fester Termin angelegt.");
  };

  return (
    <div className="tt-root" lang="de">
      <div className="tt-bg" aria-hidden="true" />
      <div className="tt-phone">
        {tab === "cal" ? (
          <>
            <header className="tt-top">
              <button type="button" className="tt-add" aria-label="Termin hinzufügen" onClick={() => setAddOpen(true)}>
                <PlusIcon />
              </button>
              {next ? (
                <button type="button" className="tt-next tt-glass" onClick={() => setDate(next.date)}>
                  <span className="tt-next-label">Next up · {relativeDay(next.date, SAMPLE_TODAY)}</span>
                  <span className="tt-next-title">{next.entry.title}</span>
                  <span className="tt-next-meta">
                    {range(next.entry)}
                    {next.entry.location && (
                      <>
                        <PinIcon size={12} />
                        {next.entry.location}
                      </>
                    )}
                  </span>
                </button>
              ) : (
                <div className="tt-next tt-glass">
                  <span className="tt-next-title">Nichts mehr geplant</span>
                </div>
              )}
            </header>
            <h1 className="tt-date">
              <span className="tt-date-wd">{parts.wd.toUpperCase()}</span> {parts.day}
            </h1>
            <main className="tt-main tt-glass">
              <DayView date={date} entries={dayEntries} onConflictTap={openAlternatives} />
            </main>
            <DateSlider
              mode={mode}
              onMode={setMode}
              date={date}
              onDate={setDate}
              min={SAMPLE_RANGE.min}
              max={SAMPLE_RANGE.max}
            />
          </>
        ) : (
          <Learnplan
            courses={courses}
            groups={sampleGroups}
            entries={entries}
            onExport={() => showToast("Kalender exportiert (nur im Mockup).")}
          />
        )}
        <TabBar tab={tab} onTab={setTab} onVoice={() => setVoiceOpen(true)} />
        <Toast toast={toast} onDismiss={dismissToast} />
      </div>

      {conflictEntry && (
        <ConflictDialog
          entry={conflictEntry}
          entries={entries}
          alternatives={alternativesOf(conflictEntry)}
          shownDate={date}
          onChoose={(alt) => {
            setPreview({ entryId: conflictEntry.id, alt });
            setConflictId(null);
          }}
          onClose={() => setConflictId(null)}
        />
      )}
      {preview && previewEntry && (
        <ChangePreview
          before={previewEntry}
          after={moveToSession(previewEntry, preview.alt, courses.find((c) => c.id === previewEntry.courseId)!)}
          onBack={() => {
            setConflictId(previewEntry.id);
            setPreview(null);
          }}
          onApply={applyMove}
          onClose={() => setPreview(null)}
        />
      )}
      {addOpen && <AddSheet date={date} onSave={addEntry} onClose={() => setAddOpen(false)} />}
      {voiceOpen && <VoiceOverlay courses={courses} onConfirm={applyIntent} onClose={() => setVoiceOpen(false)} />}
    </div>
  );
}
