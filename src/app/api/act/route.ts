/**
 * SLICE C – HANDELN
 * POST /api/act  JSON: { constraints?, priorities?, current? } → { plan: Plan, meta }
 * Reiner TS-Planer, keine KI.
 */
import { NextResponse } from "next/server";
import { solve } from "@/features/act/solver";
import { syncPlan } from "@/features/act/gcal";
import data from "@/data/courses.json";
import { isMock, mockPlan } from "@/lib/mocks";
import type { Choice, Constraint, CourseData, Priority } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const t0 = Date.now();
    const body = (await req.json().catch(() => ({}))) as {
      constraints?: Constraint[];
      priorities?: Priority[];
      current?: Choice[];
      /** false = Google-Kalender nicht anfassen */
      sync?: boolean;
    };
    const plan = isMock() ? mockPlan : solve(data as CourseData, body.constraints ?? [], body.priorities ?? [], body.current);
    const ms = Date.now() - t0;
    // Google-Kalender: Fehler oder Timeout ändern nichts am Plan, stehen nur in meta.calendar
    const calendar = isMock() || body.sync === false ? { calendar: "off" } : await syncPlan(data as CourseData, plan.chosen, body.constraints ?? []);
    return NextResponse.json({ plan, meta: { provider: "solver", model: "solver", ms, mock: isMock() || undefined, ...calendar } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[act]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
