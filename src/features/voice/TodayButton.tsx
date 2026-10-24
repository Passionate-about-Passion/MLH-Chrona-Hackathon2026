"use client";
/**
 * SLICE D – SPRECHEN (frontend)
 * "Heute vorlesen": reads today's appointments aloud via SpeakButton (/api/speak → ElevenLabs).
 * TODO: replace DayEvent with the appointment type from src/lib/types.ts once the contract is agreed.
 */
import { SpeakButton } from "./SpeakButton";

export interface DayEvent {
  title: string;
  /** ISO date-time, e.g. "2026-10-24T14:00" */
  start: string;
  end: string;
  location?: string;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** 14:00 → "14 Uhr", 14:30 → "14 Uhr 30" (sounds natural in TTS) */
function spokenTime(d: Date) {
  const m = d.getMinutes();
  return m === 0 ? `${d.getHours()} Uhr` : `${d.getHours()} Uhr ${m}`;
}

export function todayText(events: DayEvent[], now = new Date()) {
  const date = now.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
  const today = events
    .filter((e) => sameDay(new Date(e.start), now))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  if (today.length === 0) return `Heute, ${date}, hast du keine Termine. Genieß den freien Tag!`;

  const lines = today.map((e) => {
    const where = e.location ? ` in ${e.location}` : "";
    return `Von ${spokenTime(new Date(e.start))} bis ${spokenTime(new Date(e.end))}: ${e.title}${where}.`;
  });
  const count = today.length === 1 ? "einen Termin" : `${today.length} Termine`;
  return `Heute, ${date}, hast du ${count}. ${lines.join(" ")}`;
}

/** Demo data for today until the real schedule comes from the planner. */
export function sampleDay(now = new Date()): DayEvent[] {
  const at = (h: number, m = 0) => {
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  return [
    { title: "Vorlesung Mikroökonomik", start: at(10, 15), end: at(11, 45), location: "Hörsaal O 138" },
    { title: "Tutorium Statistik", start: at(13, 45), end: at(15, 15), location: "Raum B 6" },
    { title: "Fußballtraining", start: at(18), end: at(19, 30) },
  ];
}

export function TodayButton({ events }: { events: DayEvent[] }) {
  return <SpeakButton text={todayText(events)} lang="de" label="📅 Heute vorlesen" />;
}
