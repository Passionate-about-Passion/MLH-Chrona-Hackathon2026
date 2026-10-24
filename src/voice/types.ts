import type { Priority } from "@/lib/types";

export type Transcript = { text: string; lang: "de" };

export type ParsedIntent =
  | {
      type: "block_time";
      date: string; // ISO yyyy-mm-dd
      start: string; // HH:MM
      end: string; // HH:MM
      title?: string;
      fixed: true;
    }
  /** a wish such as "dienstags frei" – the solver avoids it if it can */
  | { type: "free_wish"; date: string; start: string; end: string; title?: string; fixed: false }
  | { type: "set_course_weight"; courseId: string; weight: number /* 1-5 */ }
  /** "Welche Termine habe ich am Mittwoch?" – date missing = whole week */
  | { type: "query"; date?: string }
  | { type: "unknown" };

export interface VoiceContext {
  /** current course weights (backend scale 1-3), so the model keeps them */
  priorities: Priority[];
  /** ISO date of today */
  today: string;
  /** chosen Studiengang and Fachsemester, so the model only sees these courses */
  program?: string;
  term?: number;
}

export interface VoiceService {
  startListening(): Promise<void>;
  /** Speech-to-Text (e.g. IBM Granite Speech) */
  stopListening(): Promise<Transcript>;
  /** Language model (e.g. Gemma 4), returns JSON */
  parseIntent(t: Transcript): Promise<ParsedIntent>;
  /** Text-to-Speech (e.g. ElevenLabs) */
  speak(text: string): Promise<void>;
  /** optional: stop recording and discard it (no transcription) */
  cancelListening?(): Promise<void>;
  /** optional: the UI passes the current plan context before parsing */
  setContext?(ctx: VoiceContext): void;
}
