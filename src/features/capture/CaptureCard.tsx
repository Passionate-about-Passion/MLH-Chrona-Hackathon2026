"use client";
/**
 * SLICE A – ERFASSEN (frontend)
 * Photo upload / camera + optional note → calls /api/analyze → hands Analysis to parent.
 */
import { useState } from "react";
import type { Analysis, Meta } from "@/lib/types";

export function CaptureCard({
  provider,
  onResult,
}: {
  provider: string;
  onResult: (analysis: Analysis, meta: Meta) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData();
    if (file) fd.append("image", file);
    if (note) fd.append("note", note);
    if (provider) fd.append("provider", provider);
    try {
      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      onResult(data.analysis, data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-300 p-6 text-neutral-500 hover:border-neutral-500 dark:border-neutral-700">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Vorschau" className="max-h-64 rounded-lg" />
        ) : (
          <span>📷 Foto aufnehmen oder hochladen</span>
        )}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
        />
      </label>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional: Frage oder Notiz"
        className="rounded-xl border border-neutral-300 bg-transparent p-3 dark:border-neutral-700"
      />
      <button
        disabled={loading || (!file && !note)}
        className="rounded-xl bg-neutral-900 px-4 py-3 font-medium text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
      >
        {loading ? "Gemma liest…" : "Analysieren"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
