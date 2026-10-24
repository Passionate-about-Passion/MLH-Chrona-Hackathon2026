/**
 * Real VoiceService on top of the existing team modules:
 * - Speech-to-Text: Web Speech API in the browser (de-DE), demo sentence if the browser has none
 * - parseIntent:   POST /api/analyze (Gemma 4, see src/app/api/analyze/route.ts)
 * - speak:         POST /api/speak (ElevenLabs), falls back to the browser voice (e.g. 501 without key)
 */
import type { Day, Understanding } from "@/lib/types";
import { DAYS, toUiWeight } from "@/adapters/backend";
import { addDays, weekdayOf } from "@/components/timetable/logic";
import type { ParsedIntent, Transcript, VoiceContext, VoiceService } from "./types";

const DEMO_SENTENCE = "Donnerstag 14 bis 16 Uhr habe ich einen festen Termin";

interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

let rec: Recognition | null = null;
let heard = "";
let ctx: VoiceContext = { priorities: [], today: new Date().toISOString().slice(0, 10) };

/** next date (today or later) that falls on `day` */
const nextDate = (day: Day, today: string) => addDays(today, (DAYS.indexOf(day) - weekdayOf(today) + 7) % 7);

function toIntent(u: Understanding, today: string): ParsedIntent {
  if (u.questions.length) return { type: "unknown" };
  if (u.intent === "query") {
    return { type: "query", date: u.queryDay && u.queryDay !== "week" ? nextDate(u.queryDay, today) : undefined };
  }
  const c = u.constraints[0];
  if (c) {
    const base = { date: nextDate(c.day, today), start: c.start, end: c.end, title: c.label };
    return c.hard ? { type: "block_time", ...base, fixed: true } : { type: "free_wish", ...base, fixed: false };
  }
  const changed = u.priorities.find((p) => ctx.priorities.find((q) => q.courseId === p.courseId)?.weight !== p.weight);
  if (changed) return { type: "set_course_weight", courseId: changed.courseId, weight: toUiWeight(changed.weight) };
  return { type: "unknown" };
}

export const browserVoiceService: VoiceService = {
  setContext(next) {
    ctx = next;
  },

  async startListening() {
    heard = "";
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      rec = null;
      return;
    }
    rec = new Ctor();
    rec.lang = "de-DE";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      heard = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ");
    };
    rec.start();
  },

  async stopListening(): Promise<Transcript> {
    if (!rec) return { text: DEMO_SENTENCE, lang: "de" };
    const r = rec;
    rec = null;
    await new Promise<void>((resolve) => {
      r.onend = () => resolve();
      r.onerror = () => resolve();
      r.stop();
      setTimeout(resolve, 1500);
    });
    return { text: heard.trim(), lang: "de" };
  },

  async parseIntent(t) {
    if (!t.text) return { type: "unknown" };
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: t.text, priorities: ctx.priorities, today: DAYS[weekdayOf(ctx.today)] }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? `Analyse antwortet mit ${res.status}`);
    return toIntent(json.understanding as Understanding, ctx.today);
  },

  async speak(text) {
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const audio = new Audio(URL.createObjectURL(await res.blob()));
      await audio.play();
    } catch {
      if (!("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "de-DE";
      window.speechSynthesis.speak(u);
    }
  },
};
