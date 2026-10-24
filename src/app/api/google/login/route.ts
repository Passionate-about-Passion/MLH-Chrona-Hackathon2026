/**
 * GET /api/google/login → Weiterleitung zum Google-Login (einmal am Laptop öffnen).
 */
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { GOOGLE_SCOPE, oauthConfigured, redirectUri } from "@/features/act/gcal";

export const runtime = "nodejs";

export async function GET() {
  if (!oauthConfigured()) {
    return NextResponse.json({ error: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET fehlen in .env.local" }, { status: 500 });
  }
  const state = randomBytes(16).toString("hex");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: GOOGLE_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  }).toString();
  const res = NextResponse.redirect(url);
  res.cookies.set("g_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}
