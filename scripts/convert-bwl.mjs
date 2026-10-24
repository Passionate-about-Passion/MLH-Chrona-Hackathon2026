// backend/bwl_courses.json -> src/data/bwl.json (CourseData). Run: node scripts/convert-bwl.mjs
import { readFileSync, writeFileSync } from "node:fs";

const SEM = { start: "2026-10-26", end: "2027-02-05" }; // Daten enthalten nur Serien-Zeiträume (Sep-Dez), daher fest
const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const KIND = { lecture: ["Vorlesung", "v"], exercise: ["Übung", "u"], tutorial: ["Tutorium", "t"] }; // introduction etc. -> weggelassen

const src = JSON.parse(readFileSync("backend/bwl_courses.json", "utf8"));

const room = (s) => {
  const ch = s.location_changes.find(
    (c) => c.effective_from <= SEM.start && (!c.effective_until || c.effective_until >= SEM.start) && c.room_code,
  );
  const loc = ch?.room_code ? ch : s.location;
  if (!loc?.room_code) return undefined;
  // Quadrat vorn dran ("A 5, 6 Bauteil B" -> "A 5 B 144"), damit der Lageplan das Gebäude kennt; Schloss bleibt "O 142"
  const quad = loc.building?.match(/^([A-Z] \d+)/)?.[1];
  return quad ? `${quad} ${loc.room_code}` : loc.room_code;
};

const courses = [];
for (const m of Object.values(src.modules)) {
  const id = m.code.toLowerCase().replace(/\s+/g, "");
  const groups = [];
  for (const eid of m.event_ids) {
    const ev = src.events[eid];
    const k = KIND[ev.type];
    if (!k) continue;
    // gemeinsame Events (z. B. CC302/CC303 TUT) landen bei jedem Modul
    ev.parallel_groups.forEach((pg, i) => {
      const sessions = pg.schedules
        .filter((s) => s.recurrence === "weekly")
        .map((s) => ({ day: DAYS[s.weekday_iso - 1], start: s.start_time, end: s.end_time, room: room(s) }));
      if (sessions.length) groups.push({ id: `${id}-${k[1]}${pg.number ?? i + 1}`, kind: k[0], sessions });
    });
  }
  if (!groups.length) {
    console.error(`weggelassen: ${m.code} (keine woechentlichen Termine)`);
    continue;
  }
  // nur eine Gruppe je Art -> ohne Nummer (acc300-v)
  for (const kind of ["v", "u", "t"]) {
    const g = groups.filter((x) => x.id.startsWith(`${id}-${kind}`));
    if (kind === "v" && g.length === 1) g[0].id = `${id}-v`;
  }
  courses.push({
    id,
    name: `${m.code} · ${m.name}`,
    required: true,
    ects: m.ects ?? 6, // ECO 301: ECTS fehlt in den Daten
    exam: true,
    term: 1, // Daten enthalten kein Fachsemester
    groups,
  });
}

const ids = courses.flatMap((c) => c.groups.map((g) => g.id));
const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
if (dup.length) throw new Error("doppelte Group-IDs: " + dup);

const out = { program: { id: "bwl", name: "BWL (B.Sc.)" }, semester: SEM, courses, fixed: [] };
// eine Gruppe pro Zeile, wie bisher
const body = courses
  .map(
    (c) =>
      `    { "id": ${JSON.stringify(c.id)}, "name": ${JSON.stringify(c.name)}, "required": ${c.required}, "ects": ${c.ects}, "exam": ${c.exam}, "term": ${c.term},\n      "groups": [\n` +
      c.groups.map((g) => "        " + JSON.stringify(g)).join(",\n") +
      "\n      ] }",
  )
  .join(",\n");
writeFileSync(
  "src/data/bwl.json",
  `{\n  "program": {"id":"bwl","name":"BWL (B.Sc.)"},\n  "semester": ${JSON.stringify(SEM)},\n  "courses": [\n${body}\n  ],\n  "fixed": []\n}\n`,
);
console.error(`${courses.length} Kurse, ${ids.length} Gruppen`);
