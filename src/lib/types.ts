/**
 * THE CONTRACT between the 4 slices. Agree on this at 11:30, then everyone builds against it.
 * Change it only after telling the team (it breaks other slices).
 *
 *  Slice A  Erfassen   (capture)    → produces: image + note        → POST /api/analyze
 *  Slice B  Verstehen  (understand) → produces: Analysis            ← /api/analyze
 *  Slice C  Handeln    (act)        → consumes Analysis + Action    → POST /api/act → ActResult
 *  Slice D  Sprechen   (voice)      → consumes any text             → POST /api/speak → audio/mpeg
 */

export interface Action {
  id: string;
  /** Button label shown to the user, e.g. "Antwort entwerfen" */
  label: string;
  /** What /api/act should do, e.g. "draft_reply" | "explain_simple" | "find_deadline" */
  type: string;
}

export interface Analysis {
  title: string;
  summary: string;
  keyPoints: string[];
  /** ISO dates or human text, e.g. "2026-11-07" */
  deadlines: string[];
  actions: Action[];
  /** BCP-47 language of the source, e.g. "de" */
  language: string;
}

export interface ActResult {
  actionId: string;
  text: string;
  /** Optional sources when Google Search grounding was used */
  sources?: { title: string; url: string }[];
}

export interface Meta {
  provider: string;
  model: string;
  ms: number;
  mock?: boolean;
}

export type ApiError = { error: string };
