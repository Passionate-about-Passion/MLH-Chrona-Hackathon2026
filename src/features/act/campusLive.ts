export type LibLocation = { name: string; percent: number; seats: number; level: "gering" | "mittel" | "hoch"; building: string };
export type Meal = { line?: string; title: string; price?: string };

const SEGMENTS: [RegExp, string, string][] = [
  [/westfl/i, "W", "Ausleihzentrum Schloss Westflügel"],
  [/ehrenhof/i, "EO", "Schloss Ehrenhof"],
  [/schneckenhof/i, "SN", "Schloss Schneckenhof"],
  [/\bA\s?3\b/, "A3", "Bibliotheksbereich A3"],
  [/\bA\s?5\b/, "A5", "Bibliotheksbereich A5"],
];

const decode = (s: string) =>
  s
    .replace(/&shy;|­/gi, "")
    .replace(/&nbsp;| /gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&euro;/gi, "€")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&[a-z]+;/gi, " ");

export function plain(html: string): string {
  return decode(html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

/** Bibliotheks-Auslastung aus der Uni-Seite; je Treffer "… Auslastung: N % von M Arbeitsplätzen" + Standortname danach. */
export function parseLibrary(html: string): LibLocation[] {
  const text = plain(html);
  const re = /(\p{L}+)\s+Auslastung:\s*(\d+)\s*%\s*von\s*(\d+)\s*Arbeitspl/giu;
  const hits = [...text.matchAll(re)];
  const out: LibLocation[] = [];
  hits.forEach((m, i) => {
    const seg = text.slice(m.index + m[0].length, hits[i + 1]?.index ?? text.length).slice(0, 160);
    const lv = m[1].toLowerCase();
    const level = lv.startsWith("gering") ? "gering" : /^mitt/.test(lv) ? "mittel" : "hoch";
    const found = SEGMENTS.find(([rx]) => rx.test(seg));
    if (found && !out.some((o) => o.building === found[1]))
      out.push({ name: found[2], percent: +m[2], seats: +m[3], level, building: found[1] });
  });
  return out;
}

/** Tagesplan der Studierendenwerk-API (tl1/menuplan): Zeilen mit Linie, Gericht (ohne Zusatzstoffe), Preis. */
export function parseMensa(html: string): Meal[] {
  const meals: Meal[] = [];
  for (const row of html.split(/<tr\b/i).slice(1)) {
    const cell = (cls: string) => new RegExp(`class="${cls}[^"]*"[^>]*>([\\s\\S]*?)</td>`, "i").exec(row)?.[1];
    const body = cell("speiseplan-table-menu-content");
    if (!body) continue;
    const title = plain(body.replace(/<sup[\s\S]*?<\/sup>/gi, ""))
      .replace(/\s+,/g, ",")
      .replace(/#\w+/g, "")
      .trim();
    if (!title) continue;
    const line = plain(cell("speiseplan-table-menu-headline") ?? "") || undefined;
    const price = /<i class="price">([\s\S]*?)<\/i>/i.exec(row)?.[1];
    meals.push({ line, title, price: price ? plain(price) : undefined });
  }
  return meals;
}
