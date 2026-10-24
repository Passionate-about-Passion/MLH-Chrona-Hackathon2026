# Aufgaben als fertige Prompts

Jede Aufgabe ist ein Prompt, den eine frische Claude-Session allein abarbeiten kann.
Anlegen: `/new-task <beschreibung>` (oder `task-writer` nach `/bugcheck`). Abarbeiten: `/next-task <A|B|C|D>`.
Nichts löschen: Erledigtes nach unten verschieben. Ab **14:00** nur noch Bugfixes und Demo-Stabilität.

## Vorlage

```
### TASK-### · <Titel>
- Bereich: A|B|C|D · Modell: haiku|sonnet|opus · Prio: P0|P1|Feature · Bug: BUG-### (optional)
- Status: offen | 🔄 in Arbeit (Name) | erledigt (<commit>)
> Ziel: <ein Satz>
> Dateien: <pfade>
> Fertig, wenn: <Befehl oder Klickpfad, der es beweist>
> Nicht anfassen: <was tabu ist>
```

## Übersicht Stundenplan-Assistent (Plan: `docs/backend.md`)

| ID | Aufgabe | Bereich | Modell | Wer | Status |
|---|---|---|---|---|---|
| 005 | Vertrag `types.ts`, Kursdaten `courses.json`, Gemma-Prompt | B | opus | Lenny | erledigt (Branch `lenny/stundenplan`) |
| 006 | `/api/analyze`: Satz → Sperrzeiten, Gewichte, Rückfragen, Abfrage | B | sonnet | Lenny | erledigt (nicht committet) |
| 007 | Planer `/api/act`: Gewichte, fest/Wunsch, wenig Änderungen | C | sonnet | Lenny | erledigt (nicht committet) |
| 008 | „Welche Termine habe ich?" → Antworttext → ElevenLabs | D | sonnet | Lenny | erledigt (nicht committet) |
| 009 | Frontend: Sprechen → Rückfragen → Wochenplan → Vorlesen | alle | sonnet | Frontend-Person (nicht Lenny) | offen (nach 006–008) |
| 013 | Google-Kalender-Sync: nach jeder Planänderung sofort im Google Kalender | C | sonnet | Lenny | offen |
| 010 | Test: versteht Gemma 4 Audio direkt (Ollama)? | B | sonnet | Lenny | 🔄 in Arbeit (Subagent) |
| 011 | `scripts/voice.py` je nach Ergebnis von 010 entfernen oder umbauen | D | haiku | Lenny | offen (nach 010) |
| 012 | Doku: `interfaces.md`, `decisions.md`, `scope.md` an Stundenplan anpassen | – | haiku | Lenny | erledigt (nicht committet) |

## Offen

### TASK-006 · `/api/analyze`: Satz → Understanding
- Bereich: B · Modell: sonnet · Prio: Feature
- Status: erledigt (nicht committet)
> Ziel: `/api/analyze` nimmt einen gesprochenen/getippten Satz und gibt `{ understanding: Understanding, meta }` zurück (Typ in `src/lib/types.ts`). Der Prompt `ANALYZE_SYSTEM` in `src/lib/prompts.ts` ist fertig und getestet – nicht umschreiben, nur bei klaren Fehlern minimal nachbessern.
> Eingabe: JSON `{ text: string, today?: Day, provider?: Provider }`. Zusätzlich weiter `multipart` mit Feld `note` annehmen (altes Frontend). `today` fehlt → Wochentag aus `new Date()` (Mo…So).
> Ablauf: `src/data/courses.json` importieren, an Gemma nur `{id, name, required, ects, exam}` pro Kurs schicken. User-Prompt: `Courses: <json>\nToday: <Day>\nStudent said: <text>`. Aufruf über `ask({ system: ANALYZE_SYSTEM, prompt, json: true, provider })` aus `src/lib/ai.ts`.
> Antwort prüfen (Funktion `clean` in derselben Datei; Vorlage: `clean()` in `scripts/voice.py`): `intent` nur "reschedule"|"query" (sonst "reschedule"); Constraints nur mit gültigem Tag, `HH:MM`, `start < end`, `hard` als boolean (fehlt → true); Priorities nur bekannte courseIds, weight auf 1–3 begrenzt, fehlende Kurse mit Standardgewicht (Pflicht+Prüfung 3, Pflicht 2, Wahl 1, reason "Standardgewicht"); Questions nur mit Frage und ≥ 2 Optionen (max. 4); `queryDay` nur Tag oder "week", nur bei intent "query"; `transcript` = Eingabetext. Kein JSON → 502 `{ error, raw }`.
> Mock: `MOCK_UNDERSTANDING` in `src/lib/mocks.ts` (Satz „Donnerstag 14 bis 16 Uhr habe ich einen festen Termin" → Do 14:00–16:00 hard). Datei vor dem Bearbeiten neu lesen, nur ergänzen – eine andere Aufgabe ergänzt dort parallel.
> Fertig, wenn: `npm run typecheck && npm run lint` grün und mit `AI_PROVIDER=ollama` (lokal `gemma4:e4b`, `npx next dev -p 3006`) diese Sätze richtig verstanden werden: „Donnerstag 14–16 Uhr habe ich einen Termin" (Do hard) · „Ich will dienstags frei haben" (Di 08–22, hard false) · „Mathe ist mir super wichtig" (mathe1 → 3) · „Welche Termine habe ich am Dienstag?" (query, Di) · „Was habe ich heute?" (query, today) · „Ab 14 Uhr habe ich nächsten Donnerstag keine Zeit" (mind. eine Rückfrage). Ergebnisse kurz berichten.
> Nicht anfassen: `ACT_SYSTEM`, `src/app/api/act/`, `src/features/`, `types.ts`. Kein `npm run build` (läuft parallel), kein Commit.

### TASK-007 · Planer `/api/act`
- Bereich: C · Modell: sonnet · Prio: Feature
- Status: erledigt (nicht committet)
> Ziel: Aus Kursdaten, Sperrzeiten und Gewichten den besten Wochenplan berechnen – reines TypeScript, keine KI.
> Dateien: `src/features/act/solver.ts` (reine Funktion), `src/features/act/solver.check.ts` (Selbsttest), `src/app/api/act/route.ts` (ersetzen), `src/lib/mocks.ts` (nur `mockPlan` ergänzen; vorher neu lesen, eine andere Aufgabe ergänzt dort parallel).
> `solve(data: CourseData, constraints: Constraint[], priorities: Priority[], current?: Choice[]): Plan` (Typen in `src/lib/types.ts`):
> - Pro Kurs pro `kind` genau eine Gruppe wählen – oder den ganzen Kurs weglassen. Alle Kombinationen durchprobieren (Backtracking reicht, ~5 Kurse).
> - Sperrzeiten = `constraints` + `data.fixed`. Überschneidung zweier gewählter Termine oder mit `hard`-Sperrzeit → ungültig. Gleiche Grenze (Ende 12:00 / Start 12:00) ist keine Überschneidung.
> - Punkte = Summe der Gewichte der eingeplanten Kurse (fehlt Priority → 2) minus 0,5 pro Termin, der eine `hard: false`-Sperrzeit schneidet.
> - Gleichstand → weniger geänderte Gruppen gegenüber `current`; dann niedrigerer Gruppenindex (ohne `current` ist der Startplan also die jeweils erste Gruppe – das ist der Demo-Startplan).
> - `dropped` = weggelassene Kurse, `changes` = Gruppenwechsel ggü. `current` als `{ courseId, kind, from: "Di 14:00–16:00", to: "Mi 08:00–10:00" }`, `conflicts` = deutsche Sätze für Termine, die trotz Wunsch bleiben („Mathematik I Vorlesung bleibt Di 10:00–12:00 – gibt es nur dann") und für weggelassene Kurse, `alternatives` = andere gültige Gruppen der geänderten/weggelassenen Kurse mit kurzem Grund.
> Route: POST JSON `{ constraints?: Constraint[], priorities?: Priority[], current?: Choice[] }` → `{ plan: Plan, meta: { provider: "solver", model: "solver", ms } }`. Lädt `src/data/courses.json`. Bei MOCK=1 `mockPlan` zurückgeben. Fehler als `{ error }`.
> Selbsttest `solver.check.ts` mit `node:assert`, nur relative Imports (läuft mit `node src/features/act/solver.check.ts`, Node 26 entfernt Typen selbst; JSON per `fs` lesen): (a) ohne Constraints → alle ersten Gruppen, keine Änderungen; (b) `Do 14:00–16:00 hard` mit current = (a) → nur `stat-u1 → stat-u2`; (c) `Di 08:00–22:00 hard:false` mit current = (a) → `mathe1-v` bleibt (Konflikttext), `mathe1-u1→u2`, `prog1-u1→u2`, `bwl-t1→t2`, `spanisch-1→2`; (d) zwei Kurse mit Gewicht 3 vs 1 und unvermeidbarer harter Überschneidung → der mit 1 steht in `dropped`.
> Fertig, wenn: `node src/features/act/solver.check.ts` grün, `npm run typecheck && npm run lint` grün, `curl -X POST localhost:<port>/api/act -d '{}'` liefert den Startplan.
> Nicht anfassen: `ANALYZE_SYSTEM`, `/api/analyze`, `types.ts`. Kein `npm run build`, kein Commit.

### TASK-008 · „Welche Termine habe ich?" → Antwort → ElevenLabs
- Bereich: D · Modell: sonnet · Prio: Feature
- Status: erledigt (nicht committet)
> Ziel: Fragt die Nutzerin „Welche Termine habe ich am Dienstag?", liest die App die Termine mit ElevenLabs vor. Den Antworttext baut Code aus dem Plan, nicht Gemma – so kann nichts erfunden werden.
> Dateien: `src/features/voice/describe.ts`, `src/features/voice/describe.check.ts`, `src/features/voice/SpeakButton.tsx`, `src/app/api/speak/route.ts`.
> `describeSchedule(data: CourseData, plan: Plan, day: Day | "week", constraints: Constraint[] = []): string` – deutscher Fließtext zum Vorlesen, Zeiten sprechbar („von 10 bis 12 Uhr"), chronologisch, inkl. Raum und fester privater Termine (`data.fixed` + `hard`-Constraints). Beispiele: „Am Dienstag hast du 2 Termine: von 10 bis 12 Uhr Mathematik I, Vorlesung in der Aula, und von 12 bis 14 Uhr Programmieren I, Übung im PC-Pool." · „Am Samstag hast du frei." · Woche: pro Tag ein kurzer Satz, freie Tage zusammenfassen.
> `describeChanges(data: CourseData, plan: Plan): string` – „Ich habe 2 Termine verschoben: Statistik Übung von Donnerstag 14 Uhr auf Freitag 12 Uhr, …" plus `conflicts`; keine Änderungen → „Dein Plan passt schon, nichts zu ändern."
> `SpeakButton`: optionale Prop `autoPlay` – spielt ab, sobald sich `text` ändert (für die Antwort auf eine Frage). Fallback auf Browser-Sprache bleibt.
> `/api/speak`: deutsche Aussprache sicherstellen (`eleven_multilingual_v2` bleibt; `language_code: "de"` mitschicken, falls das Modell es unterstützt, sonst weglassen). Ohne Key weiter 501.
> Selbsttest `describe.check.ts` mit `node:assert`, nur relative Imports, JSON per `fs` aus `src/data/courses.json`; Plan von Hand bauen (alle ersten Gruppen): Dienstag nennt Mathematik I, Programmieren I, Mathe-Übung, BWL-Tutorium, Spanisch in Zeitreihenfolge; Samstag → „frei".
> Fertig, wenn: `node src/features/voice/describe.check.ts` grün, `npm run typecheck && npm run lint` grün.
> Nicht anfassen: `/api/analyze`, `/api/act`, `src/features/act/`, `types.ts`. Kein `npm run build`, kein Commit.

### TASK-009 · Frontend: Sprechen → Wochenplan
- Bereich: alle (gemeinsam `page.tsx`) · Modell: sonnet · Prio: Feature
- Status: offen (erst nach 006, 007, 008) · Wer: Frontend-Person, nicht Lenny
> Ziel: Eine Seite, auf der man spricht und der Wochenplan sich umlegt. Skill `frontend-design` nutzen, Handy (390 px) zuerst.
> Ablauf: Beim Laden `POST /api/act {}` → Startplan. Eingabe: großer Mikrofon-Knopf (Web Speech API, `de-DE`) + Textfeld (auf dem iPhone geht die Tastatur-Diktierfunktion). Text → `POST /api/analyze`. Gibt es `questions`: Optionen als Knöpfe, Klick schickt `<text> Klarstellung: <Frage> -> <Option>` erneut. `intent: "reschedule"` → neue Constraints zu den bisherigen hinzufügen, `POST /api/act { constraints, priorities, current }` → Plan ersetzen, Änderungen hervorheben, `describeChanges` vorlesen. `intent: "query"` → `describeSchedule` mit `SpeakButton autoPlay` vorlesen und den Tag hervorheben.
> Wochenansicht Mo–Fr, 08–20 Uhr, Blöcke pro Termin (Kurs, Art, Raum), feste private Termine grau, Wünsche schraffiert, geänderte Termine kurz markiert. Darunter Gewichte mit Begründung („Pflichtmodul mit Prüfung"). Reset-Knopf = Startplan. Der Google-Kalender synchronisiert sich im Backend von selbst (TASK-013); im Frontend nur `meta.calendar` als kleines Häkchen „Im Google Kalender ✓" anzeigen.
> Dateien: `src/app/page.tsx`, neue Komponenten in `src/features/understand/` (Eingabe, Rückfragen) und `src/features/act/` (Wochenansicht). Alte Komponenten (`CaptureCard`, `AnalysisView`, `ActionPanel`) aus `page.tsx` entfernen, Dateien stehen lassen.
> Fertig, wenn: `bash scripts/check.sh` grün und im Browser (MOCK=0, `AI_PROVIDER=ollama`) die drei Demo-Sätze funktionieren: „Donnerstag 14 bis 16 Uhr habe ich einen Termin" · „Ich will dienstags frei haben" · „Welche Termine habe ich am Mittwoch?". Screenshot bei 390 px.
> Nicht anfassen: Solver-, Prompt- und Routen-Logik (nur aufrufen).

### TASK-013 · Google-Kalender-Sync (live)
- Bereich: C · Modell: sonnet · Prio: Feature
- Status: offen
> Ziel: Jede Planänderung landet sofort im Google Kalender: Nutzerin spricht → `/api/act` berechnet den Plan → derselbe Request synchronisiert den Kalender „Stundenplan". In der Demo sieht man es live auf dem Handy. Kein neues npm-Paket, kein OAuth-Login.
> Zugang: Google-**Service-Konto**. Env-Variablen (in `.env.example` als leere Platzhalter mit Kommentar ergänzen): `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` (PEM, `\n` im Wert → echte Zeilenumbrüche), `GOOGLE_CALENDAR_ID`. Fehlt eine → Sync aus (`"off"`), App läuft normal weiter.
> Dateien: `src/features/act/gcal.ts`, `src/features/act/gcal.check.ts`, `src/app/api/act/route.ts` (nur Sync-Aufruf + `meta.calendar` ergänzen), `.env.example`.
> `gcal.ts`:
> - `getAccessToken()`: JWT (RS256) mit `node:crypto` signieren (`iss` = Service-Konto, `scope` = `https://www.googleapis.com/auth/calendar`, `aud` = `https://oauth2.googleapis.com/token`, 1 h), gegen `https://oauth2.googleapis.com/token` tauschen (`grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer`). Token im Modul cachen bis kurz vor Ablauf.
> - `desiredEvents(data: CourseData, chosen: Choice[], constraints: Constraint[]): GEvent[]` (rein, testbar): pro Termin der gewählten Gruppen ein wöchentliches Event: `summary` „<Kursname> – <Art>", `location` Raum, `start/end.dateTime` am ersten passenden Wochentag ab `data.semester.start` mit `timeZone: "Europe/Berlin"`, `recurrence: ["RRULE:FREQ=WEEKLY;UNTIL=<semester.end ohne ->T225959Z"]`, `extendedProperties.private.app = "hacktober26"`. Zusätzlich `data.fixed` + `hard`-Constraints als Events (`summary` = label, `colorId` grau "8"). Event-`id` deterministisch aus Inhalt (z. B. sha1 von `groupId|day|start|end` → hex, nur Zeichen a–v/0–9, Länge ≥ 5), damit unveränderte Termine bleiben.
> - `syncCalendar(events)`: bestehende Events per `GET /calendar/v3/calendars/<id>/events?privateExtendedProperty=app%3Dhacktober26&showDeleted=false&maxResults=250` laden; nicht mehr gewünschte löschen (`DELETE`), fehlende anlegen (`POST`). Antwortet `POST` mit 409 (ID existierte schon / gelöscht) → `PUT /events/<id>` mit `status: "confirmed"`. Aufrufe parallel (`Promise.all`). Rückgabe `{ created, deleted, kept }`.
> Route `/api/act`: nach `solve()` den Sync mit `plan.chosen` + Request-`constraints` aufrufen, max. 8 s warten; Fehler dürfen den Plan nicht kaputt machen → `meta.calendar: "synced" | "off" | "error: <kurz>"` plus `meta.calendarStats`. Bei MOCK=1 kein Sync. Optional Request-Feld `sync: false` → überspringen.
> Selbsttest `gcal.check.ts` (`node:assert`, nur relative Imports, JSON per `fs`, ohne Netz): Startplan → richtige Anzahl Events (Kurs-Termine + 2 feste), erster Dienstag-Termin `2026-10-27T10:00:00`, RRULE mit `UNTIL=20270205T225959Z`, IDs stabil (2× gleich) und gültig (`/^[a-v0-9]{5,}$/`), Änderung `stat-u1 → stat-u2` ändert genau eine ID.
> Fertig, wenn: Selbsttest grün, `npm run typecheck && npm run lint` grün, `/api/act` ohne Google-Env liefert `meta.calendar: "off"`. Echter Test mit Zugang (Lenny legt ihn an, siehe `docs/backend.md` → „Google-Kalender einrichten"): Startplan → 11 Termine im Kalender, Do 14–16 sperren → nur Statistik-Übung springt auf Freitag.
> Nicht anfassen: `solver.ts`, `/api/analyze`, `types.ts`. Kein `npm run build`, kein Commit.

### TASK-011 · `scripts/voice.py` aufräumen
- Bereich: D · Modell: haiku · Prio: Feature
- Status: offen (nach Ergebnis von TASK-010)
> Ziel: Versteht Gemma Audio direkt → `voice.py` löschen. Sonst nur den Whisper-Teil entfernen oder ganz löschen (Spracherkennung macht das iPhone/der Browser).
> Fertig, wenn: keine toten Verweise auf `voice.py` mehr.

### TASK-012 · Doku an Stundenplan anpassen
- Bereich: – · Modell: haiku · Prio: Feature
- Status: erledigt (nicht committet)
> Ziel: `docs/interfaces.md` (Datenmodell + Endpunkte aus `src/lib/types.ts` und `docs/backend.md`), `docs/decisions.md` anhängen (heute: TS-Planer statt OR-Tools, Spracherkennung im Browser/iPhone statt Granite, JSON statt Datenbank, Gemma lokal über Ollama, Antworttext auf Fragen aus Code statt Gemma). In `docs/scope.md` nur die Felder „Kernfeatures" und „Demo-Skript" vorschlagen, Persona/Pitch-Satz bleiben fürs Team.
> Fertig, wenn: Doku passt zu `types.ts`, nichts gelöscht.

### TASK-001 · Prompt für die gewählte Idee schreiben
- Bereich: B · Modell: opus · Prio: Feature
- Status: überholt → TASK-005/006
> Ziel: `ANALYZE_SYSTEM` in `src/lib/prompts.ts` auf die um 11:30 gewählte Idee zuschneiden, Ausgabe passt zu `Analysis` in `src/lib/types.ts`.
> Dateien: `src/lib/prompts.ts` (nur `ANALYZE_SYSTEM`)
> Fertig, wenn: 3 Demo-Fotos aus `public/samples/` liefern über `/api/analyze` gültiges JSON mit sinnvollen Aktionen.
> Nicht anfassen: `types.ts` ohne Teamabsprache.

### TASK-002 · Aktionen für die gewählte Idee
- Bereich: C · Modell: sonnet · Prio: Feature
- Status: überholt → TASK-007
> Ziel: `ACT_SYSTEM` und die Aktionstypen an die Idee anpassen (2–3 Aktionen, die in der Demo gezeigt werden).
> Dateien: `src/lib/prompts.ts` (nur `ACT_SYSTEM`), `src/app/api/act/route.ts`
> Fertig, wenn: Jede Aktion liefert im Mock und mit echter KI in < 10 s ein Ergebnis.
> Nicht anfassen: `ANALYZE_SYSTEM`.

### TASK-003 · Look & Feel der App
- Bereich: D · Modell: sonnet · Prio: Feature
- Status: offen
> Ziel: Farben, Schrift, Startbildschirm passend zur Idee (Skill `frontend-design`), Projektname und Ein-Satz-Pitch im Header.
> Dateien: `src/app/globals.css`, `src/app/page.tsx` (nur Header), `src/features/voice/`
> Fertig, wenn: App sieht auf Handy (390 px) und Beamer gut aus, `bash scripts/check.sh` grün.
> Nicht anfassen: Logik in `src/features/capture|understand|act`.

### TASK-004 · Demo-Fotos und Kamera-Flow
- Bereich: A · Modell: haiku · Prio: Feature
- Status: überholt → TASK-009 (keine Fotos mehr)
> Ziel: 2–3 starke Demo-Fotos in `public/samples/`, Upload-Text in `CaptureCard.tsx` an die Idee anpassen.
> Dateien: `public/samples/`, `src/features/capture/CaptureCard.tsx`
> Fertig, wenn: Foto vom Handy → Analyse erscheint.
> Nicht anfassen: API-Routen.

## Erledigt
