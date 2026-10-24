# Inventar: Bausteine der Stundenplan-App

Stand 2026-10-24, 13:40. Grundlage: `main` (994712d), alle Branches, PRs #1 und #2, `PROMPT.md`, `docs/backend.md`.

| Baustein | Ort im Repo | Status | Schnittstelle (Ein → Aus) |
|---|---|---|---|
| Datenmodell (Vertrag) | `src/lib/types.ts` | fertig | `Course { id, name, required, ects, exam, term, groups }`, `Group { id, kind: "Vorlesung"\|"Übung"\|"Tutorium", sessions }`, `Session { day: "Mo".."So", start, end, room? }`, `Constraint { day, start, end, label, hard }`, `Priority { courseId, weight 1-3, reason }`, `Plan { chosen, dropped, conflicts, alternatives, changes }`, `CourseData { program, courses, fixed, semester }` |
| Termin-Import | `src/data/demo.json`, `src/data/index.ts`, `GET /api/programs` | teilweise | Von Hand gepflegte JSON-Datei pro Studiengang (5 Kurse Demo). `getProgram(id)`, `selectCourses(data, { term, courseIds })`. Kein Scraper. Echte BWL-Daten (TASK-015) fehlen, `backend/bwl_courses.json` ist leer |
| Solver / Optimierung | `src/features/act/solver.ts`, `POST /api/act` | fertig (TS-Backtracking statt OR-Tools) | `{ constraints, priorities, current, sync?, program?, term? }` → `{ plan: Plan, meta: { calendar, calendarStats } }`. Gewicht 1-3 pro Kurs, harte Blöcke verboten, Wünsche −0,5, bei Gleichstand wenigste Änderungen zu `current` |
| Sprachmodell (Gemma 4) | `POST /api/analyze`, `src/lib/ai.ts`, `ANALYZE_SYSTEM` in `src/lib/prompts.ts` | fertig (braucht Ollama oder Key) | `{ text, priorities?, today? }` → `{ understanding: { intent: "reschedule"\|"query", constraints, priorities, questions, queryDay? } }`. Bei `MOCK=1` fester Demo-Satz |
| Speech-to-Text | – | fehlt (Granite) | Laut `docs/backend.md` Web Speech API im Browser statt IBM Granite. Kein Code im Repo |
| Text-to-Speech (ElevenLabs) | `POST /api/speak`, `src/features/voice/SpeakButton.tsx`, `src/features/voice/describe.ts` | fertig | `{ text }` → `audio/mpeg`, `501` ohne Key (Fallback Browser-Stimme). `describeSchedule(data, plan, day, constraints)`, `describeChanges(data, plan)` bauen den Vorlesetext |
| Google-Kalender-Sync | `src/features/act/gcal.ts`, `/api/google/*` | fertig | Läuft in `/api/act` mit, `GET /api/google/status` → `{ configured, connected }` |
| Frontend | `src/components/timetable/` (Route `/mockup`), `src/voice/` | teilweise | UI-Mockup mit Beispieldaten (`src/data/sample.ts`, eigenes `src/types.ts`), `VoiceService` mit Mock. `src/app/page.tsx` zeigt noch den alten Foto-Starter |
| „Heute vorlesen"-Knopf | Branch `feat/d-heute-vorlesen` (`TodayButton.tsx`) | teilweise, nicht gemergt | Eigener Termin-Typ `DayEvent`. Doppelt zu `describeSchedule`, deshalb nicht übernommen |

## Annahmen

- **Design-Vorlage fehlt:** `mockup-reference.dc.html` lag weder als Anhang noch im Repo oder auf dem Rechner vor. Die UI folgt der Textbeschreibung im Auftrag und dem bestehenden Mockup.
- **Kein OR-Tools:** Der vorhandene TS-Solver bleibt (Teamentscheidung in `docs/backend.md`). Alternativen pro Konflikt (bis zu 3) baut ein dünner Adapter: Vorschlag des Solvers zuerst, dann übrige freie Gruppen.
- **Gewichte:** Backend rechnet mit 1-3 (Vertrag). Die UI zeigt 1-5. Umrechnung im Adapter: 1→1, 2→3, 3→5; zurück 1-2→1, 3→2, 4-5→3.
- **Termine sind wöchentlich:** `Constraint` kennt kein Datum (TASK-018 offen). Selbst angelegte Termine und Sprach-Blöcke gelten jede Woche am selben Wochentag. Ort und Wichtigkeit privater Termine hält nur die UI.
- **Speech-to-Text:** Web Speech API (`de-DE`) hinter `VoiceService`. Ohne Browser-Unterstützung nutzt der Dienst den Demo-Satz.
- **`src/types.ts` und `src/data/sample.ts`** bleiben nur für das alte Mockup. Die App liest ausschließlich `src/lib/types.ts` und `src/data/`.
- **Rückfragen von Gemma** (`questions`) werden in der UI noch nicht als Knöpfe gezeigt. Die App behandelt den Satz dann als „nicht verstanden".
- **Start:** Die integrierte App läuft unter `/` (`src/app/page.tsx`, laut TASK-020 erlaubt). Der alte Foto-Starter wird dort entfernt, die Dateien bleiben liegen.
