/** The UI imports `voice` from here and nothing else. Swap the implementation on the next line. */
import { mockVoiceService } from "./mockVoiceService";
import { speak } from "./elevenlabsSpeak";
import type { VoiceService } from "./types";

// Listening + parseIntent still mocked; speak is real (ElevenLabs, browser fallback).
export const voice: VoiceService = { ...mockVoiceService, speak };
export type { ParsedIntent, Transcript, VoiceService } from "./types";
