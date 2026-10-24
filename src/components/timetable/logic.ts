import type { Course, Entry, Group, Session } from "@/types";

export const HOUR_START = 0;
export const HOUR_END = 24;
/** where the day view opens when a day has no appointments */
export const DAY_OPEN_HOUR = 8;

export const WD_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
export const WD_LONG = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
export const MONTHS_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
export const MONTHS_LONG = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

/* ---------- time ---------- */

export const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export const fromMin = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

export const range = (e: { start: string; end: string }) => `${e.start}–${e.end}`;

/** Rooms in the data are short codes ("A 5 B144"), so the campus is added for the map search. */
const MAP_CAMPUS = "Universität Mannheim";
export const mapsUrl = (location: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location}, ${MAP_CAMPUS}`)}`;

/* ---------- dates (UTC, so the time zone never shifts a day) ---------- */

const utc = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const toIso = (d: Date) => d.toISOString().slice(0, 10);

export const addDays = (iso: string, n: number) => {
  const d = utc(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toIso(d);
};

export const addMonths = (iso: string, n: number) => {
  const d = utc(iso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return toIso(d);
};

/** 0 = Monday … 6 = Sunday */
export const weekdayOf = (iso: string) => (utc(iso).getUTCDay() + 6) % 7;

/** The date of weekday `wd` in the week that contains `iso`. */
export const dateInWeek = (iso: string, wd: number) => addDays(iso, wd - weekdayOf(iso));

export const clampDate = (iso: string, min: string, max: string) => (iso < min ? min : iso > max ? max : iso);

export function dayParts(iso: string) {
  const d = utc(iso);
  return {
    wd: WD_SHORT[weekdayOf(iso)],
    day: `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`,
    month: `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
  };
}

export function relativeDay(iso: string, today: string) {
  if (iso === today) return "Heute";
  if (iso === addDays(today, 1)) return "Morgen";
  const p = dayParts(iso);
  return `${p.wd}, ${p.day}`;
}

/* ---------- entries ---------- */

export const entriesOn = (entries: Entry[], iso: string) =>
  entries
    .filter((e) => (e.recurring ? e.wd === weekdayOf(iso) : e.date === iso))
    .sort((a, b) => toMin(a.start) - toMin(b.start) || toMin(a.end) - toMin(b.end));

export const overlaps = (a: { start: string; end: string }, b: { start: string; end: string }) =>
  toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);

export function conflictIds(list: Entry[]) {
  const ids = new Set<string>();
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (overlaps(list[i], list[j])) {
        ids.add(list[i].id);
        ids.add(list[j].id);
      }
    }
  }
  return ids;
}

export interface Placed {
  entry: Entry;
  col: number;
  cols: number;
}

/** Puts overlapping entries next to each other. */
export function layoutDay(list: Entry[]): Placed[] {
  const sorted = [...list].sort((a, b) => toMin(a.start) - toMin(b.start) || toMin(a.end) - toMin(b.end));
  const out: Placed[] = [];
  let cluster: Entry[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (!cluster.length) return;
    const colEnds: number[] = [];
    const items: { entry: Entry; col: number }[] = [];
    for (const e of cluster) {
      let c = colEnds.findIndex((end) => end <= toMin(e.start));
      if (c === -1) {
        c = colEnds.length;
        colEnds.push(0);
      }
      colEnds[c] = toMin(e.end);
      items.push({ entry: e, col: c });
    }
    for (const it of items) out.push({ ...it, cols: colEnds.length });
    cluster = [];
    clusterEnd = -1;
  };

  for (const e of sorted) {
    if (cluster.length && toMin(e.start) >= clusterEnd) flush();
    cluster.push(e);
    clusterEnd = Math.max(clusterEnd, toMin(e.end));
  }
  flush();
  return out;
}

/** "in 25 Min", "in 3 Std 10 Min", "in 1 Tag 2 Std 5 Min" until `date` at `start` (local time); zero parts are left out */
export function untilText(date: string, start: string, now = new Date()) {
  const total = Math.ceil((new Date(`${date}T${start}:00`).getTime() - now.getTime()) / 60000);
  if (total <= 0) return "Jetzt";
  const d = Math.floor(total / (24 * 60));
  const h = Math.floor((total % (24 * 60)) / 60);
  const m = total % 60;
  const parts = [d ? (d === 1 ? "1 Tag" : `${d} Tagen`) : "", h ? `${h} Std` : "", m ? `${m} Min` : ""].filter(Boolean);
  return `in ${parts.join(" ")}`;
}

export function nextEntry(entries: Entry[], fromIso: string, fromTime: string) {
  for (let i = 0; i < 14; i++) {
    const date = addDays(fromIso, i);
    const hit = entriesOn(entries, date).find((e) => i > 0 || toMin(e.start) >= toMin(fromTime));
    if (hit) return { entry: hit, date };
  }
  return null;
}

export const slotDay = (e: Entry) => WD_LONG[e.recurring ? (e.wd ?? 0) : weekdayOf(e.date ?? "2026-01-05")];

/* ---------- alternatives ---------- */

export interface Alternative {
  group: Group;
  session: Session;
}

/** Other groups of the same course and kind that the entry could move to. */
export function alternativesFor(entry: Entry, groups: Group[], sessions: Session[]): Alternative[] {
  if (!entry.groupId || !entry.courseId) return [];
  const own = groups.find((g) => g.id === entry.groupId);
  if (!own) return [];
  return groups
    .filter((g) => g.courseId === own.courseId && g.kind === own.kind && g.id !== own.id)
    .flatMap((g) => {
      const s = sessions.find((x) => x.groupId === g.id);
      return s ? [{ group: g, session: s }] : [];
    });
}

export function moveToSession(entry: Entry, alt: Alternative, course: Course): Entry {
  return {
    ...entry,
    groupId: alt.group.id,
    title: `${course.name} ${alt.group.name}`,
    wd: alt.session.wd,
    date: alt.session.date,
    start: alt.session.start,
    end: alt.session.end,
    location: alt.session.location,
    recurring: alt.session.recurring,
  };
}

/** Date on which a session happens in the week that is currently shown. */
export const sessionDate = (s: Session, shownDate: string) => (s.recurring ? dateInWeek(shownDate, s.wd ?? 0) : (s.date ?? shownDate));
