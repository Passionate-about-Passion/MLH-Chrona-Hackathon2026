/**
 * SLICE C – HANDELN
 * POST /api/act  JSON: { constraints?, priorities?, current? } → { plan: Plan, meta }
 * Reiner TS-Planer, keine KI.
 */
import { NextResponse } from "next/server";
import { solve } from "@/features/act/solver";
import data from "@/data/courses.json";
import { isMock, mockPlan } from "@/lib/mocks";
import type { Choice, Constraint, CourseData, Priority } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const t0 = Date.now();
    const body = (await req.json().catch(() => ({}))) as { constraints?: Constraint[]; priorities?: Priority[]; current?: Choice[] };
    const plan = isMock() ? mockPlan : solve(data as CourseData, body.constraints ?? [], body.priorities ?? [], body.current);
    return NextResponse.json({ plan, meta: { provider: "solver", model: "solver", ms: Date.now() - t0, mock: isMock() || undefined } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[act]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
