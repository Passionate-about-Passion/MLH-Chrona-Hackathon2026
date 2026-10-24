/**
 * GET /api/google/status → { connected, calendarId? } für „Mit Google verbinden" / Häkchen im Frontend.
 */
import { NextResponse } from "next/server";
import { oauthConfigured, readStore } from "@/features/act/gcal";

export const runtime = "nodejs";

export async function GET() {
  const { refresh_token, calendarId } = await readStore();
  return NextResponse.json({ configured: oauthConfigured(), connected: !!(refresh_token && calendarId), calendarId });
}
