"use client";
/**
 * SLICE C – HANDELN (frontend)
 * Shows the suggested actions, calls /api/act, displays the generated text.
 */
import { useState } from "react";
import type { Action, ActResult, Analysis } from "@/lib/types";
import { SpeakButton } from "@/features/voice/SpeakButton";

export function ActionPanel({ analysis, provider }: { analysis: Analysis; provider: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<ActResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: Action) {
    setBusy(action.id);
    setError(null);
    try {
      const res = await fetch("/api/act", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis, action, provider: provider || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {analysis.actions.map((a) => (
          <button
            key={a.id}
            onClick={() => run(a)}
            disabled={!!busy}
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            {busy === a.id ? "…" : a.label}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && (
        <div className="flex flex-col gap-3 rounded-2xl bg-neutral-100 p-5 dark:bg-neutral-900">
          <p className="whitespace-pre-wrap">{result.text}</p>
          <div className="flex gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(result.text)}
              className="rounded-full border border-neutral-300 px-3 py-1 text-sm dark:border-neutral-700"
            >
              Kopieren
            </button>
            <SpeakButton text={result.text} lang={analysis.language} />
          </div>
        </div>
      )}
    </section>
  );
}
