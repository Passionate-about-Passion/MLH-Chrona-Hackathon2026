/** The UI imports `voice` from here and nothing else. Swap the implementation on the next line. */
import { mockVoiceService } from "./mockVoiceService";
import type { VoiceService } from "./types";

export const voice: VoiceService = mockVoiceService;
export type { ParsedIntent, Transcript, VoiceService } from "./types";
