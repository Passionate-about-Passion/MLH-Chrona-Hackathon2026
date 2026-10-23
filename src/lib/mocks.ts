/**
 * Fake responses so every slice can build its UI before the backend is ready.
 * Enable with MOCK=1 in .env.local. Turn off before the demo!
 */
import type { ActResult, Analysis } from "./types";

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
