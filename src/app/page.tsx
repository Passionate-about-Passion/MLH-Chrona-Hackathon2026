/**
 * Main screen: the timetable app (src/components/timetable), wired to the backend via src/adapters.
 * Without ?program=… the app opens WiFo, 1st semester (pitch data); /?program=wahl shows the program/semester picker.
 * The old photo slices (CaptureCard, AnalysisView, ActionPanel) are no longer shown; their files stay.
 */
import type { Viewport } from "next";
import { TimetableApp } from "@/components/timetable/TimetableApp";
import { getProgram } from "@/data";
import { ProgramPicker } from "@/features/program/ProgramPicker";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function Home({ searchParams }: { searchParams: Promise<{ program?: string; term?: string }> }) {
  const { program: p, term } = await searchParams;
  // ohne ?program startet der Pitch-Datensatz WiFo, 1. Semester; Auswahl über /?program=wahl
  const program = p ?? "wifo";
  if (!getProgram(program)) return <ProgramPicker />;
  const t = term ? Number(term) : p ? undefined : 1;
  return <TimetableApp key={`${program}-${t}`} program={program} term={Number.isFinite(t) ? t : undefined} />;
}
