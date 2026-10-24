/**
 * SLICE B – VERSTEHEN (backend)
 * POST /api/analyze  JSON { text, today?, provider? }  (oder multipart mit Feld "note")
 * → { understanding: Understanding, meta: Meta }
 */
import { NextResponse } from "next/server";
import { ask, type Provider } from "@/lib/ai";
import { ANALYZE_SYSTEM } from "@/lib/prompts";
import { isMock, MOCK_UNDERSTANDING } from "@/lib/mocks";
import courseData from "@/data/courses.json";
import type { Constraint, Course, CourseData, Day, Priority, Question, Understanding } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const DAYS: Day[] = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const courses = (courseData as CourseData).courses;

const defaultWeight = (c: Course): 1 | 2 | 3 => (c.required ? (c.exam ? 3 : 2) : 1);
const isDay = (d: unknown): d is Day => DAYS.includes(d as Day);
// JS: Sonntag = 0
const todayDay = (): Day => DAYS[(new Date().getDay() + 6) % 7];

/** Gemma kann sich irren: nur gültige Werte durchlassen, fehlende Kurse mit Standardgewicht auffüllen. */
function clean(raw: Record<string, unknown>, transcript: string): Understanding {
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
    (c) => byId.get(c.id) ?? { courseId: c.id, weight: defaultWeight(c), reason: "Standardgewicht" },
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
    let today: Day | undefined;
    let provider: Provider | undefined;
    if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
      const form = await req.formData();
      text = String(form.get("note") ?? "").trim();
      provider = (form.get("provider") as Provider | null) || undefined;
    } else {
      const body = await req.json().catch(() => ({}));
      text = String(body.text ?? "").trim();
      today = isDay(body.today) ? body.today : undefined;
      provider = body.provider || undefined;
    }
    if (!text) return NextResponse.json({ error: "Bitte Text angeben" }, { status: 400 });

    if (isMock()) {
      return NextResponse.json({
        understanding: { ...MOCK_UNDERSTANDING, transcript: text },
        meta: { provider: "mock", model: "mock", ms: 0, mock: true },
      });
    }

    const list = courses.map(({ id, name, required, ects, exam }) => ({ id, name, required, ects, exam }));
    const result = await ask({
      system: ANALYZE_SYSTEM,
      prompt: `Courses: ${JSON.stringify(list)}\nToday: ${today ?? todayDay()}\nStudent said: ${text}`,
      json: true,
      provider,
    });

    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(result.text);
      if (!raw || typeof raw !== "object") throw new Error();
    } catch {
      return NextResponse.json({ error: "Modell hat kein gültiges JSON geliefert", raw: result.text }, { status: 502 });
    }

    return NextResponse.json({
      understanding: clean(raw, text),
      meta: { provider: result.provider, model: result.model, ms: result.ms },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[analyze]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
