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
  | { type: "set_course_weight"; courseId: string; weight: number /* 1-5 */ }
  | { type: "unknown" };

export interface VoiceService {
  startListening(): Promise<void>;
  /** Speech-to-Text (e.g. IBM Granite Speech) */
  stopListening(): Promise<Transcript>;
  /** Language model (e.g. Gemma 4), returns JSON */
  parseIntent(t: Transcript): Promise<ParsedIntent>;
  /** Text-to-Speech (e.g. ElevenLabs) */
  speak(text: string): Promise<void>;
}
