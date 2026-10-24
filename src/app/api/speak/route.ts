/**
 * SLICE D – SPRECHEN (backend)
 * POST /api/speak  JSON: { text: string }  → audio/mpeg (ElevenLabs)
 * Returns 501 when no ELEVENLABS_API_KEY is set → frontend falls back to browser speech.
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  if (!text?.trim()) return NextResponse.json({ error: "text fehlt" }, { status: 400 });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "ELEVENLABS_API_KEY nicht gesetzt" }, { status: 501 });

  const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
  const model = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text: text.slice(0, 2500),
      model_id: model,
      // language_code wird von multilingual_v2 nicht unterstützt (Docs) – nur bei anderen Modellen mitsenden
      ...(model === "eleven_multilingual_v2" ? {} : { language_code: "de" }),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[speak]", res.status, detail);
    return NextResponse.json({ error: `ElevenLabs ${res.status}` }, { status: 502 });
  }
  return new Response(res.body, { headers: { "Content-Type": "audio/mpeg" } });
}
