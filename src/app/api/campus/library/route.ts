import { parseLibrary, type LibLocation } from "@/features/act/campusLive";

export const runtime = "nodejs";

const URL_ = "https://www.bib.uni-mannheim.de/standorte/freie-sitzplaetze/";
let cache: { at: number; body: { updated: string; locations: LibLocation[] } } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.at < 120_000) return Response.json(cache.body);
  try {
    const res = await fetch(URL_, { headers: { "User-Agent": "Mozilla/5.0 (StundenplanApp)" }, signal: AbortSignal.timeout(6000), cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const locations = parseLibrary(await res.text());
    if (!locations.length) throw new Error("keine Daten gefunden");
    const body = { updated: new Date().toISOString(), locations };
    cache = { at: Date.now(), body };
    return Response.json(body);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Fehler", locations: [] });
  }
}
