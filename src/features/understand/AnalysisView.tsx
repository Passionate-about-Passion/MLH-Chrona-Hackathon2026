/**
 * SLICE B – VERSTEHEN (frontend)
 * Renders the Analysis returned by /api/analyze.
 */
import type { Analysis, Meta } from "@/lib/types";

export function AnalysisView({ analysis, meta }: { analysis: Analysis; meta?: Meta }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800">
      <h2 className="text-xl font-semibold">{analysis.title}</h2>
      <p>{analysis.summary}</p>
      {analysis.keyPoints.length > 0 && (
        <ul className="list-disc space-y-1 pl-5">
          {analysis.keyPoints.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      )}
      {analysis.deadlines.length > 0 && (
        <p className="rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
          ⏰ Frist: {analysis.deadlines.join(", ")}
        </p>
      )}
      {meta && (
        <p className="text-xs text-neutral-500">
          {meta.mock ? "MOCK-Modus" : `${meta.provider} · ${meta.model} · ${meta.ms} ms`}
        </p>
      )}
    </section>
  );
}
