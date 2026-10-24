/**
 * Fake responses so every slice can build its UI before the backend is ready.
 * Enable with MOCK=1 in .env.local. Turn off before the demo!
 */
import type { ActResult, Analysis, Plan, Understanding } from "./types";

export const isMock = () => process.env.MOCK === "1";

export const MOCK_ANALYSIS: Analysis = {
  title: "Beispiel-Dokument",
  summary: "Das ist eine Beispiel-Zusammenfassung, damit das Frontend ohne KI gebaut werden kann.",
  keyPoints: ["Erster wichtiger Punkt", "Zweiter wichtiger Punkt", "Dritter wichtiger Punkt"],
  deadlines: ["2026-11-07"],
  actions: [
    { id: "a1", label: "Einfach erklären", type: "explain_simple" },
    { id: "a2", label: "Antwort entwerfen", type: "draft_reply" },
  ],
  language: "de",
};

export const mockAct = (actionId: string): ActResult => ({
  actionId,
  text: "Sehr geehrte Damen und Herren,\n\nhier steht ein Beispiel-Entwurf aus dem Mock-Modus.\n\nMit freundlichen Grüßen",
});

export const MOCK_UNDERSTANDING: Understanding = {
  intent: "reschedule",
  transcript: "Donnerstag 14 bis 16 Uhr habe ich einen festen Termin",
  constraints: [{ type: "block", day: "Do", start: "14:00", end: "16:00", label: "Fester Termin", hard: true }],
  priorities: [],
  questions: [],
};

/** Startplan: jeweils die erste Gruppe jedes Kurses */
export const mockPlan: Plan = {
  chosen: [
    { courseId: "mathe1", groupId: "mathe1-v" }, { courseId: "mathe1", groupId: "mathe1-u1" },
    { courseId: "stat", groupId: "stat-v" }, { courseId: "stat", groupId: "stat-u1" },
    { courseId: "prog1", groupId: "prog1-v" }, { courseId: "prog1", groupId: "prog1-u1" },
    { courseId: "bwl", groupId: "bwl-v" }, { courseId: "bwl", groupId: "bwl-t1" },
    { courseId: "spanisch", groupId: "spanisch-1" },
  ],
  dropped: [], conflicts: [], alternatives: [], changes: [],
};
