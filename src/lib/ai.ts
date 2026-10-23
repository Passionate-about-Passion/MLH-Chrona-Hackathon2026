/**
 * One function, three ways to run Gemma 4:
 *  - "gemini"       → Google Gemini API (hosted Gemma 4)       — default, fastest to set up
 *  - "digitalocean" → DigitalOcean Inference (OpenAI-compatible) — DO challenge story
 *  - "ollama"       → local Gemma 4 E2B/E4B on the laptop       — "data never leaves the device"
 *
 * Switch with AI_PROVIDER in .env.local, or per request.
 */
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

export type Provider = "gemini" | "digitalocean" | "ollama";

export interface AskInput {
  prompt: string;
  system?: string;
  image?: { base64: string; mimeType: string };
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

  const res = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: {
      ...(system.trim() ? { systemInstruction: system } : {}),
      ...(input.googleSearch ? { tools: [{ googleSearch: {} }] } : {}),
    },
  });
  return res.text ?? "";
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

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (system.trim()) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content });

  const res = await client.chat.completions.create({ model, messages });
  return res.choices[0]?.message?.content ?? "";
}

function missing(k: string): never {
  throw new Error(`${k} missing (see .env.example)`);
}

function stripFences(s: string) {
  return s.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
}
