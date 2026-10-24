/** The UI imports `voice` from here and nothing else. Swap the implementation on the next line. */
import { browserVoiceService } from "./browserVoiceService";
import type { VoiceService } from "./types";

// offline demo without backend: import { mockVoiceService } from "./mockVoiceService";
export const voice: VoiceService = browserVoiceService;
export type { ParsedIntent, Transcript, VoiceContext, VoiceService } from "./types";
