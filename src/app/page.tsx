/**
 * Main screen: the timetable app (src/components/timetable), wired to the backend via src/adapters.
 * The old photo slices (CaptureCard, AnalysisView, ActionPanel) are no longer shown; their files stay.
 */
import type { Viewport } from "next";
import { TimetableApp } from "@/components/timetable/TimetableApp";

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function Home() {
  return <TimetableApp />;
}
