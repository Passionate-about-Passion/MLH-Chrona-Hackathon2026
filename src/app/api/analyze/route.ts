/**
 * SLICE B – VERSTEHEN (backend)
 * POST /api/analyze  JSON { text | audio (base64 WAV), today?, provider? }  (oder multipart mit Feld "note" / Datei "audio")
 * → { understanding: Understanding, meta: Meta }
 */
import { NextResponse } from "next/server";
import { ask, type Provider } from "@/lib/ai";
import { ANALYZE_SYSTEM } from "@/lib/prompts";
import { isMock, MOCK_UNDERSTANDING } from "@/lib/mocks";
import { getProgram, selectCourses } from "@/data";
import type { Constraint, Course, Day, Priority, Question, Understanding } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_AUDIO = 5_000_000; // base64-Zeichen
const DAYS: Day[] = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const defaultWeight = (c: Course): 1 | 2 | 3 => (c.required ? (c.exam ? 3 : 2) : 1);
const isDay = (d: unknown): d is Day => DAYS.includes(d as Day);
// JS: Sonntag = 0
const todayDay = (): Day => DAYS[(new Date().getDay() + 6) % 7];

/** Gemma kann sich irren: nur gültige Werte durchlassen, fehlende Kurse mit Standardgewicht auffüllen. */
function clean(raw: Record<string, unknown>, transcript: string, current: Map<string, Priority>, courses: Course[]): Understanding {
  const intent = raw.intent === "query" ? "query" : "reschedule";
  const arr = (v: unknown): Record<string, unknown>[] =>
    Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object") : [];

  const constraints: Constraint[] = arr(raw.constraints)
    .filter(
      (c) =>
        isDay(c.day) && TIME.test(String(c.start)) && TIME.test(String(c.end)) && String(c.start) < String(c.end),
    )
    .map((c) => ({
      type: "block",
      day: c.day as Day,
      start: String(c.start),
      end: String(c.end),
      label: String(c.label || "Termin"),
      hard: typeof c.hard === "boolean" ? c.hard : true,
    }));

  const byId = new Map<string, Priority>();
  for (const p of arr(raw.priorities)) {
    const w = Math.round(Number(p.weight));
    if (courses.some((c) => c.id === p.courseId) && Number.isFinite(w))
      byId.set(String(p.courseId), {
        courseId: String(p.courseId),
        weight: Math.min(3, Math.max(1, w)) as 1 | 2 | 3,
        reason: String(p.reason || ""),
      });
  }
  const priorities = courses.map(
    (c) => byId.get(c.id) ?? current.get(c.id) ?? { courseId: c.id, weight: defaultWeight(c), reason: "Standardgewicht" },
  );

  const questions: Question[] = arr(raw.questions)
    .filter((q) => q.question && Array.isArray(q.options) && q.options.length >= 2)
    .map((q) => ({ question: String(q.question), options: (q.options as unknown[]).map(String).slice(0, 4) }));

  const u: Understanding = {
    intent,
    transcript,
    constraints: intent === "query" ? [] : constraints,
    priorities: intent === "query" ? [] : priorities,
    questions,
  };
  if (intent === "query") u.queryDay = raw.queryDay === "week" || isDay(raw.queryDay) ? raw.queryDay : "week";
  return u;
}

export async function POST(req: Request) {
  try {
    let text = "";
    let audio = "";
    let today: Day | undefined;
    let provider: Provider | undefined;
    let given: unknown[] = [];
    let sel: { program?: string; term?: number; courseIds?: string[] } = {};
    if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const form = await req.formData();
      text = String(form.get("note") ?? "").trim();
      provider = (form.get("provider") as Provider | null) || undefined;
      const f = form.get("audio");
      if (f instanceof File) audio = Buffer.from(await f.arrayBuffer()).toString("base64");
    } else {
      const body = await req.json().catch(() => ({}));
      text = String(body.text ?? "").trim();
      today = isDay(body.today) ? body.today : undefined;
      provider = body.provider || undefined;
      audio = typeof body.audio === "string" ? body.audio : "";
      given = Array.isArray(body.priorities) ? body.priorities : [];
      sel = body;
    }
    if (audio.length > MAX_AUDIO) return NextResponse.json({ error: "Audio zu groß (max 5 MB)" }, { status: 413 });
    if (!text && !audio) return NextResponse.json({ error: "Bitte Text angeben" }, { status: 400 });
    if (!text && isMock()) text = "Donnerstag 14 bis 16 Uhr habe ich einen Termin"; // Mock: Audio ignorieren
    const program = getProgram(sel.program);
    if (!program) return NextResponse.json({ error: `Unbekannter Studiengang: ${sel.program}` }, { status: 400 });
    const courses = selectCourses(program, sel).courses;

    if (isMock()) {
      return NextResponse.json({
        understanding: { ...MOCK_UNDERSTANDING, transcript: text },
        meta: { provider: "mock", model: "mock", ms: 0, mock: true },
      });
    }

    // Stufe 1: Audio -> Text (Gemma, lokal)
    let audioMs: number | undefined;
    if (!text) {
      const t = await ask({
        prompt: "Transkribiere dieses Audio wörtlich. Gib nur den gesprochenen Text aus.",
        audio,
        provider,
      });
      audioMs = t.ms;
      text = t.text.trim();
      if (!text) return NextResponse.json({ error: "Audio nicht verstanden" }, { status: 400 });
    }

    const list = courses.map(({ id, name, required, ects, exam }) => ({ id, name, required, ects, exam }));
    // Aktueller Stand aus dem Frontend: nur bekannte Kurse, Gewicht 1-3
    const current = new Map<string, Priority>();
    for (const p of given as Record<string, unknown>[]) {
      const w = Math.round(Number(p?.weight));
      if (courses.some((c) => c.id === p?.courseId) && Number.isFinite(w))
        current.set(String(p.courseId), {
          courseId: String(p.courseId),
          weight: Math.min(3, Math.max(1, w)) as 1 | 2 | 3,
          reason: String(p.reason || ""),
        });
    }
    const weights = current.size ? `\nCurrent weights: ${JSON.stringify([...current.values()])}` : "";
    const prompt = `Courses: ${JSON.stringify(list)}\nToday: ${today ?? todayDay()}${weights}\nStudent said: ${text}`;

    // Bei ungültigem JSON genau einmal neu fragen
    let result = await ask({ system: ANALYZE_SYSTEM, prompt, json: true, provider });
    let raw: Record<string, unknown> | undefined;
    for (let attempt = 0; attempt < 2 && !raw; attempt++) {
      try {
        const parsed = JSON.parse(result.text);
        if (!parsed || typeof parsed !== "object") throw new Error();
        raw = parsed;
      } catch {
        if (attempt === 1) break;
        result = await ask({
          system: ANALYZE_SYSTEM,
          prompt: `${prompt}\nYour last answer was not valid JSON.`,
          json: true,
          provider,
        });
      }
    }
    if (!raw) {
      return NextResponse.json({ error: "Modell hat kein gültiges JSON geliefert", raw: result.text }, { status: 502 });
    }

    return NextResponse.json({
      understanding: clean(raw, text, current, courses),
      meta: {
        provider: result.provider,
        model: result.model,
        ms: result.ms,
        input: audioMs === undefined ? "text" : "audio",
        ...(audioMs === undefined ? {} : { audioMs }),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[analyze]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
