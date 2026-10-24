"use client";
import "@/styles/glass.css";
import "./timetable.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Constraint, Plan, Priority } from "@/lib/types";
import type { Entry } from "@/types";
import { getProgram, selectCourses } from "@/data";
import { describeChanges, describeSchedule } from "@/features/voice/describe";
import {
  DAYS,
  alternativesFor,
  blockKey,
  calendarNote,
  fullPriorities,
  planToEntries,
  requestPlan as apiRequestPlan,
  swapChoice,
  toBackendWeight,
  uiCourses,
  uiGroups,
  type BlockExtras,
} from "@/adapters/backend";
import { voice, type ParsedIntent } from "@/voice";
import { AddSheet } from "./AddSheet";
import { ChangePreview } from "./ChangePreview";
import { ConflictDialog } from "./ConflictDialog";
import { DateSlider, type Mode } from "./DateSlider";
import { PlusIcon } from "./Icons";
import { Learnplan } from "./Learnplan";
import { MonthView } from "./MonthView";
import { TabBar, type Tab } from "./TabBar";
import { Toast, type ToastState } from "./Toast";
import { VoiceOverlay } from "./VoiceOverlay";
import { WeekPager } from "./WeekPager";
import { WeekStrip } from "./WeekStrip";
import { Onboarding, type ProgramChoice } from "./Onboarding";
import { addDays, conflictIds, entriesOn, moveToSession, nextEntry, weekdayOf, type Alternative } from "./logic";

/** room for the overlays: header + week strip on top, tab bar at the bottom */
const PAD_TOP = 164;
const PAD_BOTTOM = 112;

const localIso = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const nowTime = (d = new Date()) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

const TODAY = localIso();
/** open on Monday when today is a weekend day */
const START_DATE = weekdayOf(TODAY) >= 5 ? addDays(TODAY, 7 - weekdayOf(TODAY)) : TODAY;
type Snapshot = { plan: Plan; constraints: Constraint[]; priorities: Priority[] };
type GoogleStatus = { configured: boolean; connected: boolean };

/** Asks for Studiengang and Fachsemester first, then shows the planner for that choice. */
export function TimetableApp() {
  const [choice, setChoice] = useState<ProgramChoice | null>(null);
  if (!choice) {
    return (
      <div className="tt-root" lang="de">
        <div className="tt-phone tt-phone-center">
          <Onboarding onDone={setChoice} />
        </div>
      </div>
    );
  }
  return (
    <Planner key={`${choice.program}-${choice.term}`} {...choice} onChangeProgram={() => setChoice(null)} />
  );
}

function Planner({ program, term, onChangeProgram }: ProgramChoice & { onChangeProgram: () => void }) {
  const data = useMemo(() => selectCourses(getProgram(program)!, { term }), [program, term]);
  const groups = useMemo(() => uiGroups(data), [data]);
  const range = { min: addDays(TODAY, -60), max: data.semester?.end ?? addDays(TODAY, 180) };
  /** every solver call is for the chosen Studiengang and Fachsemester */
  const requestPlan = useCallback(
    (body: Parameters<typeof apiRequestPlan>[0]) => apiRequestPlan({ ...body, program, term }),
    [program, term],
  );

  const [plan, setPlan] = useState<Plan | null>(null);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>(() => fullPriorities(data, []));
  const [extras, setExtras] = useState<BlockExtras>({});
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState<Tab>("cal");
  const [mode, setMode] = useState<Mode>("W");
  const [date, setDate] = useState(START_DATE);
  const [conflict, setConflict] = useState<{ entryId: string; alternatives: Alternative[] } | null>(null);
  const [preview, setPreview] = useState<{ entryId: string; alt: Alternative } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const counter = useRef(1);

  const showToast = useCallback((message: string, undo?: () => void) => {
    setToast({ id: counter.current++, message, undo });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  const [google, setGoogle] = useState<GoogleStatus | null>(null);

  // start plan from the solver
  useEffect(() => {
    requestPlan({})
      .then((r) => setPlan(r.plan))
      .catch((e: Error) => setLoadError(e.message));
  }, [requestPlan]);

  // Google calendar: status for the connect button, and the result after the OAuth redirect (/?google=ok|error)
  useEffect(() => {
    fetch("/api/google/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((s: GoogleStatus | null) => setGoogle(s))
      .catch(() => setGoogle(null));
    const result = new URLSearchParams(window.location.search).get("google");
    if (result) {
      showToast(result === "ok" ? "Mit Google Kalender verbunden." : "Verbindung mit Google fehlgeschlagen.");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [showToast]);

  useEffect(() => {
    voice.setContext?.({ priorities, today: TODAY, program, term });
  }, [priorities, program, term]);

  const courses = useMemo(() => uiCourses(data, priorities), [data, priorities]);
  const entries = useMemo(
    () => (plan ? planToEntries(data, plan, constraints, priorities, extras) : []),
    [data, plan, constraints, priorities, extras],
  );
  const next = useMemo(() => nextEntry(entries, TODAY, nowTime()), [entries]);

  /** Ask the solver for a new plan. Mock mode ignores `current`, so apply the wished choice locally then. */
  const replan = async (next: { constraints: Constraint[]; priorities: Priority[]; current: Plan["chosen"] }) => {
    const r = await requestPlan(next);
    const result = r.meta.mock && plan ? { ...plan, chosen: next.current } : r.plan;
    setPlan(result);
    setConstraints(next.constraints);
    setPriorities(next.priorities);
    return { plan: result, meta: r.meta };
  };

  const snapshot = (): Snapshot | null => (plan ? { plan, constraints, priorities } : null);
  const restore = (s: Snapshot) => {
    setPlan(s.plan);
    setConstraints(s.constraints);
    setPriorities(s.priorities);
    // keep the Google calendar in line with the restored plan
    requestPlan({ constraints: s.constraints, priorities: s.priorities, current: s.plan.chosen }).catch(() => {});
  };

  /** Conflict popup: the solver's suggestion first, then other free groups (max. 3). */
  const openAlternatives = async (e: Entry, withConstraints = constraints, basePlan = plan) => {
    if (!basePlan) return;
    if (e.fixed) return showToast("Dieser Termin ist fest und lässt sich nicht verschieben.");
    if (!e.groupId) return showToast("Für diesen Termin gibt es keine Alternative.");
    let suggested: string | undefined;
    try {
      const r = await requestPlan({ constraints: withConstraints, priorities, current: basePlan.chosen, sync: false });
      suggested = r.plan.chosen.find((c) => c.courseId === e.courseId && groups.find((g) => g.id === c.groupId)?.kind === e.type)
        ?.groupId;
    } catch {
      // without the solver the popup still lists the free groups
    }
    const alternatives = alternativesFor(data, basePlan, withConstraints, e, suggested !== e.groupId ? suggested : undefined);
    if (!alternatives.length) return showToast("Für diesen Termin gibt es keine Alternative.");
    setConflict({ entryId: e.id, alternatives });
  };

  const conflictEntry = conflict && entries.find((e) => e.id === conflict.entryId);
  const previewEntry = preview && entries.find((e) => e.id === preview.entryId);
  const courseOf = (e: Entry) => courses.find((c) => c.id === e.courseId)!;

  const applyMove = async () => {
    if (!preview || !previewEntry || !plan || !previewEntry.courseId || !previewEntry.groupId) return;
    const before = snapshot()!;
    setPreview(null);
    try {
      const chosen = swapChoice(plan.chosen, previewEntry.courseId, previewEntry.groupId, preview.alt.group.id);
      const r = await replan({ constraints, priorities, current: chosen });
      showToast(`Termin verschoben.${calendarNote(r.meta)}`, () => restore(before));
    } catch (err) {
      showToast(`Planer nicht erreichbar: ${(err as Error).message}`);
    }
  };

  const addEntry = (d: Omit<Entry, "id">) => {
    const block: Constraint = { type: "block", day: DAYS[weekdayOf(date)], start: d.start, end: d.end, label: d.title, hard: true };
    setExtras({ ...extras, [blockKey(block)]: { location: d.location, weight: d.weight, fixed: d.fixed } });
    setConstraints([...constraints, block]);
    setAddOpen(false);
    showToast("Termin gespeichert.");
  };

  /** Runs only after the user confirmed the card in the voice overlay (queries need no confirmation). */
  const applyIntent = async (intent: ParsedIntent) => {
    setVoiceOpen(false);
    if (!plan) return;
    try {
      if (intent.type === "query") {
        const text = describeSchedule(data, plan, intent.date ? DAYS[weekdayOf(intent.date)] : "week", constraints);
        if (intent.date) setDate(intent.date);
        showToast(text);
        voice.speak(text).catch(() => {});
        return;
      }
      if (intent.type === "set_course_weight") {
        const before = snapshot()!;
        const next = priorities.map((p) =>
          p.courseId === intent.courseId ? { ...p, weight: toBackendWeight(intent.weight), reason: "per Sprache geändert" } : p,
        );
        const r = await replan({ constraints, priorities: next, current: plan.chosen });
        showToast(`Wichtigkeit geändert.${calendarNote(r.meta)}`, () => restore(before));
        return;
      }
      if (intent.type === "free_wish") {
        const before = snapshot()!;
        const wish: Constraint = {
          type: "block",
          day: DAYS[weekdayOf(intent.date)],
          start: intent.start,
          end: intent.end,
          label: intent.title ?? "Frei",
          hard: false,
        };
        const r = await replan({ constraints: [...constraints, wish], priorities, current: plan.chosen });
        setDate(intent.date);
        const text = describeChanges(data, r.plan);
        showToast(text, () => restore(before));
        voice.speak(text).catch(() => {});
        return;
      }
      if (intent.type !== "block_time") return;
      const block: Constraint = {
        type: "block",
        day: DAYS[weekdayOf(intent.date)],
        start: intent.start,
        end: intent.end,
        label: intent.title ?? "Fester Termin",
        hard: true,
      };
      const all = [...constraints, block];
      setConstraints(all);
      setDate(intent.date);
      setTab("cal");
      const day = entriesOn(planToEntries(data, plan, all, priorities, extras), intent.date);
      const bad = conflictIds(day);
      const hit = day.find((e) => bad.has(e.id) && !e.fixed && e.groupId);
      if (hit) await openAlternatives(hit, all, plan);
      else showToast("Fester Termin angelegt.");
    } catch (err) {
      showToast(`Das hat nicht geklappt: ${(err as Error).message}`);
    }
  };

  return (
    <div className="tt-root" lang="de">
      <div className="tt-bg" aria-hidden="true" />
      <div className="tt-phone">
        {tab === "cal" ? (
          <>
            {mode === "W" ? (
              <WeekPager
                date={date}
                entries={entries}
                onDate={setDate}
                onConflictTap={(e) => void openAlternatives(e)}
                padTop={PAD_TOP}
                padBottom={PAD_BOTTOM}
              />
            ) : (
              <div className="tt-cal tt-cal-month">
                <MonthView
                  date={date}
                  today={TODAY}
                  entries={entries}
                  onPick={(iso) => {
                    setDate(iso);
                    setMode("W");
                  }}
                />
              </div>
            )}
            {loadError && <p className="tt-error-float glass-dense">Der Planer ist nicht erreichbar: {loadError}</p>}
            <div className="tt-overlay-top">
              <header className="tt-top">
                <button type="button" className="tt-add glass" aria-label="Termin hinzufügen" onClick={() => setAddOpen(true)}>
                  <PlusIcon />
                </button>
                {next ? (
                  <button type="button" className="tt-next glass" onClick={() => setDate(next.date)}>
                    <span className="tt-next-label">Next up</span>
                    <span className="tt-next-title">{next.entry.title}</span>
                    <span className="tt-next-meta">
                      {next.entry.start}
                      {next.entry.location && ` · ${next.entry.location}`}
                    </span>
                  </button>
                ) : (
                  <div className="tt-next glass">
                    <span className="tt-next-title">{plan ? "Nichts mehr geplant" : "Plan wird berechnet …"}</span>
                  </div>
                )}
              </header>
              {mode === "W" && <WeekStrip date={date} today={TODAY} onDate={setDate} />}
            </div>
            <DateSlider mode={mode} onMode={setMode} date={date} onDate={setDate} min={range.min} max={range.max} />
          </>
        ) : (
          <Learnplan
            title={`${data.program?.name ?? program} · ${term}. Semester`}
            courses={courses}
            groups={groups}
            entries={entries}
            google={google}
            onExport={() => showToast("Kalender exportiert (nur im Mockup).")}
            onChangeProgram={onChangeProgram}
          />
        )}
        <TabBar tab={tab} onTab={setTab} onVoice={() => setVoiceOpen(true)} voiceActive={voiceOpen} />
        <Toast toast={toast} onDismiss={dismissToast} />
      </div>

      {conflict && conflictEntry && (
        <ConflictDialog
          entry={conflictEntry}
          entries={entries}
          alternatives={conflict.alternatives}
          shownDate={date}
          onChoose={(alt) => {
            setPreview({ entryId: conflictEntry.id, alt });
            setConflict(null);
          }}
          onClose={() => setConflict(null)}
        />
      )}
      {preview && previewEntry && (
        <ChangePreview
          before={previewEntry}
          after={moveToSession(previewEntry, preview.alt, courseOf(previewEntry))}
          onBack={() => {
            setPreview(null);
            void openAlternatives(previewEntry);
          }}
          onApply={() => void applyMove()}
          onClose={() => setPreview(null)}
        />
      )}
      {addOpen && <AddSheet date={date} onSave={addEntry} onClose={() => setAddOpen(false)} />}
      {voiceOpen && <VoiceOverlay courses={courses} onConfirm={(i) => void applyIntent(i)} onClose={() => setVoiceOpen(false)} />}
    </div>
  );
}
