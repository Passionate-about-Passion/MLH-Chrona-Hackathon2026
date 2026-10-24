/**
 * GET /api/google/callback?code&state → Tokens speichern, Kalender „Stundenplan" anlegen,
 * Startplan eintragen, zurück auf die Startseite.
 */
import { NextResponse, type NextRequest } from "next/server";
import { connect, syncPlan } from "@/features/act/gcal";
import { solve } from "@/features/act/solver";
import data from "@/data/courses.json";
import type { CourseData } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const home = new URL("/", req.url);
  if (!code || !state || state !== req.cookies.get("g_state")?.value) {
    home.searchParams.set("google", "error");
    return NextResponse.redirect(home);
  }
  try {
    await connect(code);
    const plan = solve(data as CourseData, [], []);
    const sync = await syncPlan(data as CourseData, plan.chosen, [], 15000);
    home.searchParams.set("google", sync.calendar === "synced" ? "ok" : "error");
  } catch (err) {
    console.error("[google/callback]", err instanceof Error ? err.message : err);
    home.searchParams.set("google", "error");
  }
  const res = NextResponse.redirect(home);
  res.cookies.delete("g_state");
  return res;
}
