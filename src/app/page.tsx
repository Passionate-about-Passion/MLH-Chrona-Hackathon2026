"use client";
/**
 * Main screen — composes the 4 slices. Keep this file thin; logic lives in src/features/*.
 */
import { useState } from "react";
import type { Analysis, Meta } from "@/lib/types";
import { CaptureCard } from "@/features/capture/CaptureCard";
import { AnalysisView } from "@/features/understand/AnalysisView";
import { ActionPanel } from "@/features/act/ActionPanel";
import { SpeakButton } from "@/features/voice/SpeakButton";

export default function Home() {
  const [provider, setProvider] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [meta, setMeta] = useState<Meta | undefined>();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500">Hacktober26 · Gemma 4</p>
          <h1 className="text-3xl font-semibold">Projektname</h1>
          <p className="text-neutral-500">Ein Satz, der erklärt, was wir lösen.</p>
        </div>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700"
          aria-label="KI-Backend"
        >
          <option value="">Standard</option>
          <option value="gemini">Gemini API</option>
          <option value="digitalocean">DigitalOcean</option>
          <option value="ollama">Lokal</option>
        </select>
      </header>

      <CaptureCard
        provider={provider}
        onResult={(a, m) => {
          setAnalysis(a);
          setMeta(m);
        }}
      />

      {analysis && (
        <>
          <AnalysisView analysis={analysis} meta={meta} />
          <div>
            <SpeakButton text={analysis.summary} lang={analysis.language} />
          </div>
          <ActionPanel analysis={analysis} provider={provider} />
        </>
      )}
    </main>
  );
}
