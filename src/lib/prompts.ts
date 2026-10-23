/**
 * All prompts in one place.
 *  - ANALYZE_SYSTEM → owned by Slice B (Verstehen)
 *  - ACT_SYSTEM     → owned by Slice C (Handeln)
 * Rewrite both once the idea is locked (≈ 11:30).
 */

export const ANALYZE_SYSTEM = `You analyse a photo (and optional note) the user shares.
Return JSON exactly in this shape:
{
  "title": string,
  "summary": string,            // 2-3 sentences, plain language
  "keyPoints": string[],        // max 5
  "deadlines": string[],        // ISO date if possible, else empty
  "actions": [{"id": string, "label": string, "type": string}],  // 1-3 useful next steps
  "language": string            // BCP-47 code of the document
}
Allowed action types: "explain_simple", "draft_reply", "find_deadline".
Write labels in the user's language.`;

export const ACT_SYSTEM = `You help the user take the next step on a document they shared.
You receive the analysis as JSON and an action type.
- explain_simple: explain the document in very simple words (A2 level), max 6 sentences.
- draft_reply: write a short, polite reply letter the user can send.
- find_deadline: state the most important deadline and what happens if it is missed.
Answer in the requested output language.`;
