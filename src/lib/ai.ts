/**
 * One function, three ways to run Gemma 4:
 *  - "gemini"       → Google Gemini API (hosted Gemma 4)       — default, fastest to set up
 *  - "digitalocean" → DigitalOcean Inference (OpenAI-compatible) — DO challenge story
 *  - "ollama"       → local Gemma 4 E2B/E4B on the laptop       — "data never leaves the device"
 *
 * Switch with AI_PROVIDER in .env.local, or per request.
 */
import { GoogleGenAI, type ThinkingLevel } from "@google/genai";
import OpenAI from "openai";

export type Provider = "gemini" | "digitalocean" | "ollama";

export interface AskInput {
  prompt: string;
  system?: string;
  image?: { base64: string; mimeType: string };
  /** base64 WAV (16 kHz mono PCM16). Ollama only. */
  audio?: string;
  provider?: Provider;
  /** Ask the model to answer with a JSON object only. */
  json?: boolean;
  /** Ground the answer with Google Search (Gemini API only). */
  googleSearch?: boolean;
}

export interface AskResult {
  text: string;
  provider: Provider;
  model: string;
  ms: number;
}

const env = (k: string, fallback = "") => process.env[k] ?? fallback;

export const MODELS: Record<Provider, () => string> = {
  gemini: () => env("GEMINI_MODEL", "gemma-4-26b-a4b-it"),
  digitalocean: () => env("DO_MODEL"),
  ollama: () => env("OLLAMA_MODEL", "gemma4:e4b"),
};

export function defaultProvider(): Provider {
  const p = env("AI_PROVIDER", "gemini") as Provider;
  return ["gemini", "digitalocean", "ollama"].includes(p) ? p : "gemini";
}

export async function ask(input: AskInput): Promise<AskResult> {
  const provider = input.provider ?? defaultProvider();
  const model = MODELS[provider]();
  if (!model) throw new Error(`No model configured for provider "${provider}" (see .env.example)`);

  if (input.audio && provider !== "ollama") throw new Error(`Audio wird von Provider "${provider}" nicht unterstützt (nur ollama)`);

  const system =
    (input.system ?? "") +
    (input.json ? "\nAnswer with a single valid JSON object only. No markdown, no code fences." : "");

  const t0 = Date.now();
  const text =
    provider === "gemini"
      ? await askGemini(model, system, input)
      : await askOpenAICompatible(provider, model, system, input);

  return { text: input.json ? stripFences(text) : text, provider, model, ms: Date.now() - t0 };
}

async function askGemini(model: string, system: string, input: AskInput): Promise<string> {
  const apiKey = env("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY missing (get one at https://aistudio.google.com/apikey)");
  const ai = new GoogleGenAI({ apiKey });

  const parts: Array<Record<string, unknown>> = [];
  if (input.image) parts.push({ inlineData: { mimeType: input.image.mimeType, data: input.image.base64 } });
  parts.push({ text: input.prompt });

  // Gemma thinks before answering: ~20 s per request by default, ~5 s with MINIMAL (measured).
  // GEMINI_THINKING=default turns it back on.
  const thinking = env("GEMINI_THINKING", "minimal").toUpperCase();
  const request = () =>
    ai.models.generateContent({
      model,
      contents: [{ role: "user", parts }],
      config: {
        ...(system.trim() ? { systemInstruction: system } : {}),
        ...(input.googleSearch ? { tools: [{ googleSearch: {} }] } : {}),
        ...(thinking === "DEFAULT" ? {} : { thinkingConfig: { thinkingLevel: thinking as ThinkingLevel } }),
      },
    });

  // The API sporadically answers 500 "Internal error" within ~1 s, sometimes twice in a row: up to 3 retries.
  for (let attempt = 0; ; attempt++) {
    try {
      return (await request()).text ?? "";
    } catch (e) {
      if (attempt >= 3 || !/"code":\s*5\d\d|INTERNAL|UNAVAILABLE/.test(String(e))) throw e;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
}

async function askOpenAICompatible(
  provider: Exclude<Provider, "gemini">,
  model: string,
  system: string,
  input: AskInput,
): Promise<string> {
  const client =
    provider === "digitalocean"
      ? new OpenAI({
          baseURL: env("DO_BASE_URL", "https://inference.do-ai.run/v1"),
          apiKey: env("DO_API_KEY") || missing("DO_API_KEY"),
        })
      : new OpenAI({ baseURL: env("OLLAMA_BASE_URL", "http://localhost:11434/v1"), apiKey: "ollama" });

  const content: OpenAI.Chat.ChatCompletionContentPart[] = [{ type: "text", text: input.prompt }];
  if (input.image) {
    content.push({
      type: "image_url",
      image_url: { url: `data:${input.image.mimeType};base64,${input.image.base64}` },
    });
  }

  if (input.audio) content.push({ type: "input_audio", input_audio: { data: input.audio, format: "wav" } });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (system.trim()) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content });

  // Ollama honors keep_alive on /v1 (verified: ollama ps → UNTIL Forever); keeps Gemma loaded.
  const extra = provider === "ollama" ? { keep_alive: -1 } : {};
  const res = await client.chat.completions.create({ model, messages, ...extra });
  return res.choices[0]?.message?.content ?? "";
}

function missing(k: string): never {
  throw new Error(`${k} missing (see .env.example)`);
}

function stripFences(s: string) {
  return s.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
}
