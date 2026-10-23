/**
 * SLICE C – HANDELN (backend)
 * POST /api/act  JSON: { analysis: Analysis, action: Action, outputLanguage?: string, provider?: Provider }
 * → { result: ActResult, meta: Meta }
 */
import { NextResponse } from "next/server";
import { ask, type Provider } from "@/lib/ai";
import { ACT_SYSTEM } from "@/lib/prompts";
import { isMock, mockAct } from "@/lib/mocks";
import type { Action, Analysis } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      analysis?: Analysis;
      action?: Action;
      outputLanguage?: string;
      provider?: Provider;
    };
    if (!body.analysis || !body.action) {
      return NextResponse.json({ error: "analysis und action sind Pflicht" }, { status: 400 });
    }
    if (isMock()) {
      return NextResponse.json({ result: mockAct(body.action.id), meta: { provider: "mock", model: "mock", ms: 0, mock: true } });
    }

    const result = await ask({
      system: ACT_SYSTEM,
      prompt: JSON.stringify({
        action: body.action.type,
        outputLanguage: body.outputLanguage ?? body.analysis.language ?? "de",
        analysis: body.analysis,
      }),
      provider: body.provider,
      // Idea: ground "find_deadline" with live web info (Gemini API only)
      googleSearch: body.action.type === "find_deadline" && (body.provider ?? process.env.AI_PROVIDER ?? "gemini") === "gemini",
    });

    return NextResponse.json({
      result: { actionId: body.action.id, text: result.text },
      meta: { provider: result.provider, model: result.model, ms: result.ms },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[act]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
