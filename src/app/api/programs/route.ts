/** GET /api/programs → [{ id, name, terms }] fürs Frontend (Dropdowns Studiengang/Semester) */
import { NextResponse } from "next/server";
import { PROGRAMS } from "@/data";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(
    Object.entries(PROGRAMS).map(([id, p]) => ({
      id,
      name: p.program?.name ?? id,
      terms: [...new Set(p.courses.flatMap((c) => (c.term != null ? [c.term] : [])))].sort((a, b) => a - b),
    })),
  );
}
