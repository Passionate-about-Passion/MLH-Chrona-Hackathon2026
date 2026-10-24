import type { VoiceService } from "./types";

/** Always "hears" the same sentence: Thursday 14–16 is a fixed appointment. Replace with a real service later. */
export const mockVoiceService: VoiceService = {
  async startListening() {},
  async stopListening() {
    return { text: "Donnerstag 14 bis 16 Uhr habe ich einen festen Termin", lang: "de" };
  },
  async parseIntent() {
    return {
      type: "block_time",
      date: "2026-10-22",
      start: "14:00",
      end: "16:00",
      title: "Fester Termin",
      fixed: true,
    };
  },
  async speak() {},
};
