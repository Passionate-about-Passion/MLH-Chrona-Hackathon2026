/**
 * Calendar export: timetable entries → .ics (iCalendar), no npm package.
 * Weekly entries repeat until the end of the semester; works with Google, Apple and Outlook calendars.
 */
import type { Entry } from "@/types";

const TZ = "Europe/Berlin";

const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  `TZID:${TZ}`,
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

/** RFC 5545 text escaping */
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/** "2026-10-23" + "14:30" → "20261023T143000" */
const stamp = (date: string, time: string) => `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;

/** first date >= from that falls on weekday wd (0 = Monday) */
function firstOn(from: string, wd: number): string {
  const d = new Date(`${from}T12:00:00`);
  const cur = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() + ((wd - cur + 7) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function toIcs(entries: Entry[], opts: { from: string; until: string }): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const until = `${opts.until.replace(/-/g, "")}T235959Z`;
  const events = entries.flatMap((e) => {
    const date = e.date ?? (e.wd !== undefined ? firstOn(opts.from, e.wd) : null);
    if (!date) return [];
    return [
      "BEGIN:VEVENT",
      `UID:${esc(e.id)}-${date}@hacktober26`,
      `DTSTAMP:${now}`,
      `DTSTART;TZID=${TZ}:${stamp(date, e.start)}`,
      `DTEND;TZID=${TZ}:${stamp(date, e.end)}`,
      ...(e.recurring && !e.date ? [`RRULE:FREQ=WEEKLY;UNTIL=${until}`] : []),
      `SUMMARY:${esc(e.title)}`,
      ...(e.location ? [`LOCATION:${esc(e.location)}`] : []),
      "END:VEVENT",
    ];
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hacktober26//Stundenplan//DE", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Stundenplan", ...VTIMEZONE, ...events, "END:VCALENDAR", ""].join("\r\n");
}

/** Builds the .ics and lets the browser download it. Returns the number of exported entries. */
export function downloadIcs(entries: Entry[], opts: { from: string; until: string }, filename = "stundenplan.ics"): number {
  const blob = new Blob([toIcs(entries, opts)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return entries.length;
}
