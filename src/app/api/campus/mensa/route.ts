import { parseMensa, type Meal } from "@/features/act/campusLive";

export const runtime = "nodejs";

const PAGE = "https://www.stw-ma.de/essen-trinken/speiseplaene/mensa-am-schloss/";
const API = "https://api.stw-ma.de/tl1/menuplan";
const MENU_ID = "bc003e93a1e942f45a99dcf8082da289"; // data-id des Plugins auf der Seite
type Body = { name: string; date: string; url: string; meals: Meal[] };
const cache = new Map<string, { at: number; body: Body }>();

const iso = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });

async function day(date: string): Promise<Meal[]> {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: "https://www.stw-ma.de", "User-Agent": "Mozilla/5.0 (StundenplanApp)" },
    body: new URLSearchParams({ id: MENU_ID, location: "610", lang: "de", date, mode: "day" }),
    signal: AbortSignal.timeout(6000),
    cache: "no-store",
  });
  if (!res.ok) return [];
  const j = (await res.json()) as { content?: string };
  return parseMensa(j.content ?? "");
}

export async function GET() {
  const hit = cache.get("m");
  if (hit && Date.now() - hit.at < 600_000) return Response.json(hit.body);
  const fail: Body = { name: "Mensa am Schloss", date: iso(new Date()), url: PAGE, meals: [] };
  try {
    // heute, sonst die nächsten Tage (Wochenende/geschlossen -> leer)
    for (let i = 0; i < 4; i++) {
      const date = iso(new Date(Date.now() + i * 86_400_000));
      const meals = await day(date);
      if (meals.length) {
        const body = { ...fail, date, meals };
        cache.set("m", { at: Date.now(), body });
        return Response.json(body);
      }
    }
  } catch {}
  return Response.json(fail);
}
