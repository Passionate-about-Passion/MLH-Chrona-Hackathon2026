/**
 * SLICE B – VERSTEHEN (backend)
 * POST /api/analyze  multipart/form-data: image (File, optional), note (string, optional), provider (optional)
 * → { analysis: Analysis, meta: Meta }
 */
import { NextResponse } from "next/server";
import { ask, type Provider } from "@/lib/ai";
import { ANALYZE_SYSTEM } from "@/lib/prompts";
import { isMock, MOCK_ANALYSIS } from "@/lib/mocks";
import type { Analysis } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    if (isMock()) {
      return NextResponse.json({ analysis: MOCK_ANALYSIS, meta: { provider: "mock", model: "mock", ms: 0, mock: true } });
    }

    const form = await req.formData();
    const note = String(form.get("note") ?? "").trim();
    const file = form.get("image");

    let image: { base64: string; mimeType: string } | undefined;
    if (file instanceof File && file.size > 0) {
      if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Bild zu groß (max 8 MB)" }, { status: 413 });
      image = { base64: Buffer.from(await file.arrayBuffer()).toString("base64"), mimeType: file.type || "image/jpeg" };
    }
    if (!image && !note) return NextResponse.json({ error: "Bitte Foto oder Text angeben" }, { status: 400 });

    const provider = (form.get("provider") as Provider | null) || undefined;
    const result = await ask({
      system: ANALYZE_SYSTEM,
      prompt: note ? `User note: ${note}` : "Analyse this document.",
      image,
      provider,
      json: true,
    });

    let analysis: Analysis;
    try {
      analysis = JSON.parse(result.text);
    } catch {
      return NextResponse.json({ error: "Modell hat kein gültiges JSON geliefert", raw: result.text }, { status: 502 });
    }

    return NextResponse.json({ analysis, meta: { provider: result.provider, model: result.model, ms: result.ms } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[analyze]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
