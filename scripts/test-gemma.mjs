#!/usr/bin/env node
/**
 * Smoke test for Gemma 4 — run TONIGHT so nothing surprises us tomorrow.
 *
 *   npm run test:gemma                 # tests every provider that has a key in .env.local
 *   npm run test:gemma -- gemini       # only one provider
 *   npm run test:gemma -- gemini path/to/photo.jpg
 *
 * Sends one text+image request per provider and prints answer + latency.
 */
import { readFileSync, existsSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

const [onlyProvider, imagePath] = process.argv.slice(2);
const env = (k, d = "") => process.env[k] ?? d;

// Tiny default test image (red square, PNG) so the test runs without any file.
const DEFAULT_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAF0lEQVR4nGP8z8BAEmAiTfmohlENQ0kDAN+vAR8tJ0ZaAAAAAElFTkSuQmCC";
const image =
  imagePath && existsSync(imagePath)
    ? { base64: readFileSync(imagePath).toString("base64"), mimeType: imagePath.endsWith(".png") ? "image/png" : "image/jpeg" }
    : { base64: DEFAULT_PNG, mimeType: "image/png" };
const prompt = imagePath ? "Describe this image in 3 short bullet points." : "What colour is this image? One word.";

const providers = {
  gemini: {
    enabled: !!env("GEMINI_API_KEY"),
    model: env("GEMINI_MODEL", "gemma-4-26b-a4b-it"),
    async run(model) {
      const ai = new GoogleGenAI({ apiKey: env("GEMINI_API_KEY") });
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ inlineData: { mimeType: image.mimeType, data: image.base64 } }, { text: prompt }] }],
      });
      return res.text;
    },
  },
  digitalocean: {
    enabled: !!env("DO_API_KEY") && !!env("DO_MODEL"),
    model: env("DO_MODEL"),
    run: (model) => openaiCompat(env("DO_BASE_URL", "https://inference.do-ai.run/v1"), env("DO_API_KEY"), model),
  },
  ollama: {
    enabled: env("OLLAMA_TEST") === "1",
    model: env("OLLAMA_MODEL", "gemma4:e4b"),
    run: (model) => openaiCompat(env("OLLAMA_BASE_URL", "http://localhost:11434/v1"), "ollama", model),
  },
};

async function openaiCompat(baseURL, apiKey, model) {
  const client = new OpenAI({ baseURL, apiKey });
  const res = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${image.mimeType};base64,${image.base64}` } },
        ],
      },
    ],
  });
  return res.choices[0]?.message?.content;
}

let failures = 0;
for (const [name, p] of Object.entries(providers)) {
  if (onlyProvider && onlyProvider !== name) continue;
  if (!p.enabled) {
    console.log(`⏭  ${name.padEnd(13)} skipped (not configured in .env.local)`);
    continue;
  }
  const t0 = Date.now();
  try {
    const text = await p.run(p.model);
    console.log(`✅ ${name.padEnd(13)} ${p.model}  ${Date.now() - t0} ms\n   → ${String(text).trim().replace(/\n/g, "\n     ")}`);
  } catch (err) {
    failures++;
    console.log(`❌ ${name.padEnd(13)} ${p.model}  ${err?.status ?? ""} ${err?.message ?? err}`);
  }
}
process.exit(failures ? 1 : 0);
