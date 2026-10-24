/**
 * SLICE C – Google-Kalender-Sync (OAuth, ohne npm-Paket)
 * Einmal über /api/google/login anmelden → refresh_token liegt in .data/google.json.
 * Danach schreibt /api/act jeden neuen Plan in den Kalender „Stundenplan".
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Choice, Constraint, CourseData, Day } from "../../lib/types";

const API = "https://www.googleapis.com/calendar/v3";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const APP_TAG = "hacktober26";
const STORE = join(process.cwd(), ".data", "google.json");
const DAY_INDEX: Record<Day, number> = { So: 0, Mo: 1, Di: 2, Mi: 3, Do: 4, Fr: 5, Sa: 6 };

export const GOOGLE_SCOPE = "https://www.googleapis.com/auth/calendar";
export const redirectUri = () => process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/google/callback";
export const oauthConfigured = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export interface GEvent {
  id: string;
  summary: string;
  location?: string;
  colorId?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  recurrence: string[];
  extendedProperties: { private: { app: string } };
}

// ponytail: ein Google-Konto pro Server (Datei), pro Nutzer speichern, falls es mehrere Nutzer gibt
interface Store {
  refresh_token?: string;
  calendarId?: string;
}

export async function readStore(): Promise<Store> {
  try {
    return JSON.parse(await readFile(STORE, "utf8")) as Store;
  } catch {
    return {};
  }
}

async function writeStore(s: Store) {
  await mkdir(join(process.cwd(), ".data"), { recursive: true });
  await writeFile(STORE, JSON.stringify(s, null, 2));
}

/* ───────── OAuth ───────── */

let cached: { token: string; until: number } | null = null;

async function tokenRequest(params: Record<string, string>) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      ...params,
    }),
  });
  const json = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; error?: string };
  if (!res.ok || !json.access_token) throw new Error(`Google-Token: ${json.error ?? res.status}`);
  cached = { token: json.access_token, until: Date.now() + ((json.expires_in ?? 3600) - 60) * 1000 };
  return json;
}

/** Callback: Code gegen Tokens tauschen, Kalender „Stundenplan" anlegen falls nötig. */
export async function connect(code: string) {
  const t = await tokenRequest({ code, redirect_uri: redirectUri(), grant_type: "authorization_code" });
  const store = await readStore();
  if (t.refresh_token) store.refresh_token = t.refresh_token;
  if (!store.refresh_token) throw new Error("Kein refresh_token erhalten – Zugriff im Google-Konto entfernen und neu anmelden");
  await writeStore(store);
  if (!store.calendarId || !(await gfetch(`/calendars/${encodeURIComponent(store.calendarId)}`)).ok) {
    const res = await gfetch("/calendars", { method: "POST", body: JSON.stringify({ summary: "Stundenplan", timeZone: "Europe/Berlin" }) });
    if (!res.ok) throw new Error(`Kalender anlegen: ${res.status}`);
    store.calendarId = ((await res.json()) as { id: string }).id;
    await writeStore(store);
  }
  return store.calendarId;
}

async function getAccessToken(): Promise<string | null> {
  if (cached && cached.until > Date.now()) return cached.token;
  const { refresh_token } = await readStore();
  if (!refresh_token || !oauthConfigured()) return null;
  return (await tokenRequest({ refresh_token, grant_type: "refresh_token" })).access_token ?? null;
}

async function gfetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error("nicht mit Google verbunden");
  return fetch(API + path, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers },
  });
}

/* ───────── Hauptkalender → feste Sperrzeiten ───────── */

type CalItem = { summary?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } };
const WEEKDAYS: Day[] = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

/** Private Termine (nicht ganztägig, kein Kurs aus `data`) werden zu harten Sperrzeiten. Rein, testbar. */
export function blocksFromEvents(items: CalItem[], data: CourseData): Constraint[] {
  // Kurs erkennen über Kürzel ("CS 301") oder Titel ("Marketing") – ponytail: Namensabgleich, kann sich irren
  const keys = data.courses.flatMap((c) => {
    const [code, title = code] = c.name.split(" · ");
    return [code, title.split(" (")[0]].map((k) => k.trim().toLowerCase()).filter((k) => k.length >= 4);
  });
  const out: Constraint[] = [];
  for (const e of items) {
    const s = e.start?.dateTime, en = e.end?.dateTime, label = (e.summary ?? "Termin").trim();
    if (!s || !en || s.slice(0, 10) !== en.slice(0, 10)) continue; // ganztägig oder über Mitternacht
    if (keys.some((k) => label.toLowerCase().includes(k))) continue; // Uni-Termin, steht schon in den Kursdaten
    const block: Constraint = { type: "block", day: WEEKDAYS[new Date(`${s.slice(0, 10)}T12:00:00Z`).getUTCDay()], start: s.slice(11, 16), end: en.slice(11, 16), label, hard: true };
    if (block.start >= block.end) continue;
    if (!out.some((b) => b.day === block.day && b.start === block.start && b.end === block.end)) out.push(block);
  }
  return out;
}

/** Liest eine Woche aus dem Hauptkalender (ab Semesterstart bzw. ab heute). Ohne Google-Verbindung: []. */
export async function busyFromPrimary(data: CourseData, timeoutMs = 3000): Promise<Constraint[]> {
  if (!oauthConfigured() || !(await readStore()).refresh_token) return [];
  const from = new Date(Math.max(Date.now(), Date.parse(`${semesterOf(data).start}T00:00:00`)));
  from.setDate(from.getDate() - ((from.getDay() + 6) % 7)); // Montag dieser Woche
  from.setHours(0, 0, 0, 0);
  const to = new Date(from.getTime() + 7 * 864e5);
  const q = `singleEvents=true&orderBy=startTime&maxResults=250&timeMin=${from.toISOString()}&timeMax=${to.toISOString()}`;
  const res = await Promise.race([
    gfetch(`/calendars/primary/events?${q}`),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeoutMs)),
  ]);
  if (!res.ok) throw new Error(`Hauptkalender lesen: ${res.status}`);
  return blocksFromEvents(((await res.json()) as { items?: CalItem[] }).items ?? [], data);
}

/* ───────── Plan → Events (rein, testbar) ───────── */

function firstDate(startIso: string, day: Day): string {
  const d = new Date(`${startIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + ((DAY_INDEX[day] - d.getUTCDay() + 7) % 7));
  return d.toISOString().slice(0, 10);
}

function semesterOf(data: CourseData) {
  if (data.semester) return data.semester;
  // kein Semester in den Daten → ab nächstem Montag 15 Wochen
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + ((8 - start.getUTCDay()) % 7 || 7));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 15 * 7);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function event(key: string, summary: string, location: string | undefined, colorId: string | undefined,
  day: Day, start: string, end: string, sem: { start: string; end: string }): GEvent {
  const date = firstDate(sem.start, day);
  return {
    // Google erlaubt a–v und 0–9; sha1-hex passt. Gleicher Inhalt → gleiche ID → Termin bleibt stehen.
    id: createHash("sha1").update(`${key}|${day}|${start}|${end}|${summary}|${location ?? ""}`).digest("hex"),
    summary,
    ...(location ? { location } : {}),
    ...(colorId ? { colorId } : {}),
    start: { dateTime: `${date}T${start}:00`, timeZone: "Europe/Berlin" },
    end: { dateTime: `${date}T${end}:00`, timeZone: "Europe/Berlin" },
    recurrence: [`RRULE:FREQ=WEEKLY;UNTIL=${sem.end.replaceAll("-", "")}T225959Z`],
    extendedProperties: { private: { app: APP_TAG } },
  };
}

export function desiredEvents(data: CourseData, chosen: Choice[], constraints: Constraint[] = []): GEvent[] {
  const sem = semesterOf(data);
  const events: GEvent[] = [];
  for (const { courseId, groupId } of chosen) {
    const course = data.courses.find((c) => c.id === courseId);
    const group = course?.groups.find((g) => g.id === groupId);
    if (!course || !group) continue;
    for (const s of group.sessions) {
      events.push(event(group.id, `${course.name} – ${group.kind}`, s.room, undefined, s.day, s.start, s.end, sem));
    }
  }
  for (const c of [...data.fixed, ...constraints.filter((c) => c.hard)]) {
    events.push(event("fixed", c.label, undefined, "8", c.day, c.start, c.end, sem));
  }
  // gleiche Sperrzeit doppelt (fixed + constraint) → nur einmal
  return events.filter((e, i) => events.findIndex((x) => x.id === e.id) === i);
}

/* ───────── Abgleich mit Google ───────── */

export async function syncCalendar(events: GEvent[]) {
  const { calendarId } = await readStore();
  if (!calendarId || !(await getAccessToken())) return null;
  const base = `/calendars/${encodeURIComponent(calendarId)}/events`;

  // ponytail: keine Paginierung, reicht bis 250 Termine
  const list = await gfetch(`${base}?privateExtendedProperty=app%3D${APP_TAG}&maxResults=250`);
  if (!list.ok) throw new Error(`Kalender lesen: ${list.status}`);
  const existing = new Set(((await list.json()) as { items?: { id: string }[] }).items?.map((e) => e.id) ?? []);
  const wanted = new Set(events.map((e) => e.id));

  const toDelete = [...existing].filter((id) => !wanted.has(id));
  const toCreate = events.filter((e) => !existing.has(e.id));

  await Promise.all(toDelete.map((id) => gfetch(`${base}/${id}`, { method: "DELETE" })));
  await Promise.all(
    toCreate.map(async (e) => {
      const res = await gfetch(base, { method: "POST", body: JSON.stringify(e) });
      // ID gab es schon (früher gelöscht) → wieder aktivieren
      if (res.status === 409) await gfetch(`${base}/${e.id}`, { method: "PUT", body: JSON.stringify({ ...e, status: "confirmed" }) });
      else if (!res.ok) throw new Error(`Termin anlegen: ${res.status}`);
    }),
  );
  return { created: toCreate.length, deleted: toDelete.length, kept: events.length - toCreate.length };
}

/** Für /api/act: synchronisieren, aber den Plan nie kaputt machen. */
export async function syncPlan(data: CourseData, chosen: Choice[], constraints: Constraint[], timeoutMs = 8000) {
  if (!oauthConfigured()) return { calendar: "off" };
  try {
    const stats = await Promise.race([
      syncCalendar(desiredEvents(data, chosen, constraints)),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeoutMs)),
    ]);
    return stats ? { calendar: "synced", calendarStats: stats } : { calendar: "off" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[gcal]", message);
    return { calendar: `error: ${message}` };
  }
}
