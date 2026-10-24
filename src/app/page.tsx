/**
 * Main screen: the timetable app (src/components/timetable), wired to the backend via src/adapters.
 * Without ?program=… the start screen asks for study program and semester first.
 * The old photo slices (CaptureCard, AnalysisView, ActionPanel) are no longer shown; their files stay.
 */
import type { Viewport } from "next";
import { TimetableApp } from "@/components/timetable/TimetableApp";
import { getProgram } from "@/data";
import { ProgramPicker } from "@/features/program/ProgramPicker";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function Home({ searchParams }: { searchParams: Promise<{ program?: string; term?: string }> }) {
  const { program, term } = await searchParams;
  if (!program || !getProgram(program)) return <ProgramPicker />;
  const t = term ? Number(term) : undefined;
  return <TimetableApp key={`${program}-${t}`} program={program} term={Number.isFinite(t) ? t : undefined} />;
}
