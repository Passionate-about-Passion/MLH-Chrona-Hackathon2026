/** The UI imports `voice` from here and nothing else. Swap the implementation on the next line. */
import { browserVoiceService } from "./browserVoiceService";
import { speak } from "./elevenlabsSpeak";
import type { VoiceService } from "./types";

// Listening + parseIntent: Gemma (audio) with browser fallback; speak: ElevenLabs, waits for the end, browser fallback.
// offline demo without backend: import { mockVoiceService } from "./mockVoiceService";
export const voice: VoiceService = { ...browserVoiceService, speak };
export type { ParsedIntent, Transcript, VoiceContext, VoiceService } from "./types";
