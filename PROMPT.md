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
| 013 | Google-Kalender-Sync: nach jeder Planänderung sofort im Google Kalender | C | sonnet | Lenny | erledigt, live getestet (Do 14–16 → Statistik-Übung Fr) |
| 014 | Stundenplan-Erstellung: Studiengang + Semester wählen → Startplan | B/C | sonnet | Lenny | erledigt (nicht committet) |
| 015 | Echte Kursdaten BWL (dann VWL, WiFo) im Format von `src/data/courses.json` | A | haiku | Emil | offen |
| 016 | Gemma bleibt geladen (keep-alive) + `npm run warmup` | B | sonnet | Lenny | erledigt (nicht committet) |
| 017 | Gewichte über mehrere Sätze merken + JSON-Retry in `/api/analyze` | B | sonnet | Lenny | erledigt (nicht committet) |
| 018 | Einmaliger Termin („nur nächsten Donnerstag") → Ausweichtermin diese Woche + Kalender-Ausnahme | B/C | sonnet | Lenny | gestrichen (Rückfrage aus Prompt entfernt, immer wöchentlich) |
| 019 | Selbsttests in `scripts/check.sh` (`npm test`) | – | haiku | Lenny | erledigt (nicht committet) |
| 020 | Prompt: Frontend an Lennys Backend anbinden (Sprache, Rückfragen, Plan, Vorlesen, Google-Status) | alle | sonnet | Frontend-Person | offen (zu TASK-009) |
| 010 | Test: versteht Gemma 4 Audio direkt (Ollama)? | B | sonnet | Lenny | erledigt: ja, `/api/analyze {audio}` → Gemma (`input_audio`), < 1 s |
| 011 | `scripts/voice.py` je nach Ergebnis von 010 entfernen oder umbauen | D | haiku | Lenny | erledigt: ersetzt durch `/api/analyze {audio}` + `recordWav.ts`; `voice.py` ungenutzt |
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
> Wochenansicht Mo–Fr, 08–20 Uhr, Blöcke pro Termin (Kurs, Art, Raum), feste private Termine grau, Wünsche schraffiert, geänderte Termine kurz markiert. Darunter Gewichte mit Begründung („Pflichtmodul mit Prüfung"). Reset-Knopf = Startplan. Achtung Handy: Mikrofon im Browser (Web Speech API) geht nur über HTTPS oder `localhost` – über `http://<Laptop-IP>:3000` auf dem iPhone kein Mikro-Knopf, die Tastatur-Diktierfunktion geht aber immer. Für den Mikro-Knopf am Handy `next dev --experimental-https` nutzen. Der Google-Kalender synchronisiert sich im Backend von selbst (TASK-013); im Frontend nur `meta.calendar` als kleines Häkchen „Im Google Kalender ✓" anzeigen.
> Dateien: `src/app/page.tsx`, neue Komponenten in `src/features/understand/` (Eingabe, Rückfragen) und `src/features/act/` (Wochenansicht). Alte Komponenten (`CaptureCard`, `AnalysisView`, `ActionPanel`) aus `page.tsx` entfernen, Dateien stehen lassen.
> Fertig, wenn: `bash scripts/check.sh` grün und im Browser (MOCK=0, `AI_PROVIDER=ollama`) die drei Demo-Sätze funktionieren: „Donnerstag 14 bis 16 Uhr habe ich einen Termin" · „Ich will dienstags frei haben" · „Welche Termine habe ich am Mittwoch?". Screenshot bei 390 px.
> Nicht anfassen: Solver-, Prompt- und Routen-Logik (nur aufrufen).

### TASK-020 · Frontend an Lennys Backend anbinden (Prompt für TASK-009)
- Bereich: alle (gemeinsam `page.tsx`) · Modell: sonnet · Prio: Feature
- Status: offen · Wer: Frontend-Person, nicht Lenny
> Ziel: Das Frontend aus TASK-009 nutzt alle Backend-Funktionen. Den Text unten in die Claude-Code-Sitzung der Frontend-Person kopieren (Skills `frontend-design`, bei Browser-APIs zuerst `modern-web-guidance`).

````
Baue das Frontend (TASK-009 in PROMPT.md) so, dass es Lennys Backend direkt und vollständig nutzt. Lies zuerst CLAUDE.md, docs/interfaces.md, src/lib/types.ts, src/lib/mocks.ts. Typen immer aus @/lib/types importieren, keine eigenen Kopien. Lenny hat die Backend-Routen fertig; du rufst sie nur auf.

Vorhanden und wiederzuverwenden: src/features/voice/SpeakButton.tsx (Props text, lang, autoPlay; nutzt /api/speak, Fallback speechSynthesis ist eingebaut), src/features/voice/describe.ts (describeSchedule, describeChanges). Alt und aus page.tsx zu entfernen (Dateien stehen lassen): CaptureCard, AnalysisView, ActionPanel (Typen Analysis/ActResult gelten nicht mehr).

ABLAUF
1. Beim Laden: POST /api/act {} -> { plan, meta }. Das ist der Startplan. Kursdaten für die Anzeige: import data from "@/data/courses.json" (CourseData: courses, fixed, semester).
2. Eingabe: großer Mikrofon-Knopf plus Textfeld. Der Knopf nutzt `startRecording()` aus src/features/voice/recordWav.ts und schickt `POST /api/analyze { audio }` (base64 WAV; Gemma transkribiert lokal, meta.input = "audio"). Bei Fehler (400 "Audio nicht verstanden", kein Mikro, keine Erlaubnis) Fallback: Web Speech API (lang "de-DE", nur wenn window.SpeechRecognition / webkitSpeechRecognition da ist) bzw. Textfeld.
3. POST /api/analyze, JSON { text: string, priorities?: Priority[] } (optional today?: Day, provider?: Provider). Immer die aktuellen priorities mitschicken, sonst springen Gewichte zurück. Antwort { understanding, meta }. Understanding: { intent: "reschedule" | "query", transcript, constraints: Constraint[], priorities: Priority[], questions: Question[], queryDay?: Day | "week" }. Fehler: { error } (400 kein Text, 502 Modell ohne gültiges JSON, 500). Zeige Fehler dezent und lass Eingabe nutzbar.
4. questions nicht leer: Frage + Optionen als Knöpfe anzeigen. Klick sendet denselben Satz erneut an /api/analyze als `<text> Klarstellung: <Frage> -> <Option>`. Erst danach weiter mit Schritt 5 bzw. 6.
5. intent "reschedule": merke dir constraints (neue zu den bisherigen hinzufügen, Duplikate vermeiden) und priorities = understanding.priorities (ersetzen). Dann POST /api/act { constraints: alle bisherigen, priorities, current: vorheriges plan.chosen }. current ist wichtig: so ändert der Planer nur das Nötige. Antwort { plan, meta }. Plan ersetzen, plan.changes ({ courseId, kind, from, to }) im Wochenplan hervorheben und als Liste zeigen, plan.dropped (courseIds, die weichen mussten) und plan.conflicts (deutsche Sätze, z. B. warum ein Termin trotz Wunsch bleibt) anzeigen, plan.alternatives (Choice + reason) als kleine Vorschläge. Danach describeChanges(data, plan) per <SpeakButton text=... autoPlay /> vorlesen.
6. intent "query" (z. B. „Welche Termine habe ich am Mittwoch?"): kein /api/act. Text = describeSchedule(data, plan, understanding.queryDay ?? "week", bisherigeConstraints) mit <SpeakButton autoPlay />, Text auch anzeigen, den Tag im Wochenplan hervorheben ("week" = nichts hervorheben).
7. Vorlesen: SpeakButton ruft /api/speak { text } auf. 501 (kein ElevenLabs-Key) ist normal und fällt automatisch auf speechSynthesis zurück; kein Fehler anzeigen.
8. Reset-Knopf: Constraints, priorities, current leeren und POST /api/act {} neu.

GOOGLE-KALENDER (Backend synchronisiert selbst, du zeigst nur Status)
- GET /api/google/status -> { configured: boolean, connected: boolean }. Beim Laden abfragen. configured && !connected: Knopf „Mit Google verbinden" als normaler Link <a href="/api/google/login"> (volle Navigation, kein fetch). Nach der Anmeldung landet man auf /?google=ok (Fehler: /?google=error): kurz „Verbunden" bzw. „Verbindung fehlgeschlagen" zeigen. Nicht configured: nichts anzeigen.
- /api/act liefert meta.calendar: "synced" | "off" | "error: <kurz>" und meta.calendarStats (z. B. { created, deleted, kept }). Bei "synced": „Kalender synchronisiert: N neu, M entfernt" (aus calendarStats). "off": nichts. "error: ...": dezenter Hinweis mit dem Text, Plan trotzdem normal zeigen. Hinweis: Der erste Startplan (POST /api/act {}) synchronisiert ebenfalls. Request-Feld sync: false überspringt den Sync, nur für reine Vorschau nutzen, nicht für echte Änderungen.
- Falls /api/google/* oder meta.calendar noch fehlen (Backend von Lenny noch nicht gemergt): git pull; sonst tolerant bauen (404/fehlendes Feld = nichts anzeigen) und Lenny Bescheid sagen.

LADEZEITEN
Gemma läuft lokal: /api/analyze kann einige Sekunden dauern (nach langer Pause beim ersten Mal 30 s oder mehr). Zeige sofort einen Ladezustand (Spinner/„Ich überlege ..."), sperre doppeltes Absenden, setze keinen kurzen Timeout. /api/act ist schnell, außer dem Kalender-Sync (bis ca. 8 s).

ANSICHT
Wochenplan Mo–Fr (Sa/So nur wenn Termine), 08–20 Uhr. Blöcke je Session der plan.chosen-Gruppen (Kursname, group.kind, Raum). Feste Termine (data.fixed und constraints mit hard: true) grau, Wünsche (hard: false) schraffiert, geänderte Termine kurz markiert. Darunter priorities mit weight und reason. Handy (390 px) zuerst. Mikro im Browser geht nur über HTTPS oder localhost; auf dem iPhone über http://<IP>:3000 gilt die Tastatur-Diktierfunktion, für den Mikro-Knopf next dev --experimental-https.

REGELN
- Nur Frontend-Dateien ändern: src/app/page.tsx, neue Komponenten in src/features/understand/ (Eingabe, Rückfragen) und src/features/act/ (Wochenansicht), src/app/globals.css, SpeakButton nur falls nötig.
- Nicht ändern: src/app/api/**, solver.ts, gcal.ts, describe.ts, src/lib/ai.ts, src/lib/prompts.ts, src/data/. src/lib/types.ts nur lesen; Ergänzungen nur nach Absprache mit Lenny.
- MOCK=0 und AI_PROVIDER=ollama gelten (kein MOCK-Frontend bauen); die Antworten kommen vom echten Backend.
- Demo-fokussiert, nach Scope-Freeze 14:00 nur noch Bugfixes. Keine neuen Libraries ohne Absprache.
- Vor jedem Commit: bash scripts/check.sh. Zuerst git pull.

AKZEPTANZKRITERIEN
- [ ] Beim Laden erscheint der Startplan (POST /api/act {}).
- [ ] „Donnerstag 14 bis 16 Uhr habe ich einen Termin": nur Statistik-Übung wird verschoben, changes sichtbar, wird vorgelesen.
- [ ] „Ich will dienstags frei haben": Wunsch schraffiert, nicht verschiebbare Termine bleiben mit Begründung aus plan.conflicts.
- [ ] „Welche Termine habe ich am Mittwoch?": Antworttext angezeigt und automatisch vorgelesen, Tag hervorgehoben, kein /api/act-Aufruf.
- [ ] Rückfrage (z. B. „Ab 14 Uhr habe ich nächsten Donnerstag keine Zeit"): Optionen als Knöpfe, Klick schickt Klarstellung.
- [ ] Zweiter Satz behält Gewichte und frühere Constraints (priorities und current werden mitgeschickt).
- [ ] Ladezustand bei /api/analyze, Fehler dezent, App bleibt bedienbar.
- [ ] 501 von /api/speak: Browser-Stimme spricht statt Fehler.
- [ ] Google: Verbinden-Link nur wenn configured && !connected; nach Änderung „Kalender synchronisiert: N neu, M entfernt"; bei error nur dezenter Hinweis, Plan sichtbar.
- [ ] Reset-Knopf stellt den Startplan her.
- [ ] bash scripts/check.sh grün, Screenshot bei 390 px.
````
> Nicht anfassen: Backend-Dateien (siehe Regeln im Prompt).

### TASK-013 · Google-Kalender-Sync (live)
- Bereich: C · Modell: sonnet · Prio: Feature
- Status: offen
> Ziel: Jede Planänderung landet sofort im Google Kalender: Nutzerin spricht → `/api/act` berechnet den Plan → derselbe Request synchronisiert den Kalender „Stundenplan". In der Demo sieht man es live auf dem Handy. Kein neues npm-Paket, kein OAuth-Login.
> Zugang: **OAuth-Login mit Google** (einmal am Laptop über `http://localhost:3000` anmelden). Env-Variablen (in `.env.example` als leere Platzhalter mit Kommentar ergänzen): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (Standard `http://localhost:3000/api/google/callback`). Token wird serverseitig in `.data/google.json` gespeichert (`.data/` in `.gitignore` eintragen) – so funktioniert der Sync auch, wenn danach das Handy die App bedient. `// ponytail: ein Google-Konto pro Server, pro Nutzer speichern, falls es mehrere Nutzer gibt`. Fehlt Client-ID oder Token → Sync aus (`"off"`), App läuft normal weiter.
> Dateien: `src/features/act/gcal.ts`, `src/features/act/gcal.check.ts`, `src/app/api/google/login/route.ts`, `src/app/api/google/callback/route.ts`, `src/app/api/google/status/route.ts`, `src/app/api/act/route.ts` (nur Sync-Aufruf + `meta.calendar` ergänzen), `.env.example`, `.gitignore`.
> OAuth ohne npm-Paket, nur `fetch`:
> - `GET /api/google/login` → Redirect zu `https://accounts.google.com/o/oauth2/v2/auth` mit `client_id`, `redirect_uri`, `response_type=code`, `scope=https://www.googleapis.com/auth/calendar`, `access_type=offline`, `prompt=consent`, `state` (zufällig, als httpOnly-Cookie gesetzt und im Callback geprüft).
> - `GET /api/google/callback?code&state` → `state` prüfen, Code bei `https://oauth2.googleapis.com/token` tauschen (`grant_type=authorization_code`), `refresh_token` in `.data/google.json` speichern. Gibt es dort noch keine `calendarId`: Kalender „Stundenplan" per `POST /calendar/v3/calendars` (`timeZone: Europe/Berlin`) anlegen und ID speichern. Danach Redirect auf `/?google=ok` (Fehler → `/?google=error`).
> - `GET /api/google/status` → `{ connected: boolean, calendarId?: string }` (fürs Frontend: „Mit Google verbinden"-Knopf oder Häkchen).
> `gcal.ts`:
> - `getAccessToken()`: mit `refresh_token` bei `https://oauth2.googleapis.com/token` (`grant_type=refresh_token`) ein Access-Token holen, im Modul cachen bis kurz vor Ablauf. Kein Token-Datei → `null`.
> - `desiredEvents(data: CourseData, chosen: Choice[], constraints: Constraint[]): GEvent[]` (rein, testbar): pro Termin der gewählten Gruppen ein wöchentliches Event: `summary` „<Kursname> – <Art>", `location` Raum, `start/end.dateTime` am ersten passenden Wochentag ab `data.semester.start` mit `timeZone: "Europe/Berlin"`, `recurrence: ["RRULE:FREQ=WEEKLY;UNTIL=<semester.end ohne ->T225959Z"]`, `extendedProperties.private.app = "hacktober26"`. Zusätzlich `data.fixed` + `hard`-Constraints als Events (`summary` = label, `colorId` grau "8"). Event-`id` deterministisch aus Inhalt (z. B. sha1 von `groupId|day|start|end` → hex, nur Zeichen a–v/0–9, Länge ≥ 5), damit unveränderte Termine bleiben.
> - `syncCalendar(events)`: bestehende Events per `GET /calendar/v3/calendars/<id>/events?privateExtendedProperty=app%3Dhacktober26&showDeleted=false&maxResults=250` laden; nicht mehr gewünschte löschen (`DELETE`), fehlende anlegen (`POST`). Antwortet `POST` mit 409 (ID existierte schon / gelöscht) → `PUT /events/<id>` mit `status: "confirmed"`. Aufrufe parallel (`Promise.all`). Rückgabe `{ created, deleted, kept }`.
> Route `/api/act`: nach `solve()` den Sync mit `plan.chosen` + Request-`constraints` aufrufen, max. 8 s warten; Fehler dürfen den Plan nicht kaputt machen → `meta.calendar: "synced" | "off" | "error: <kurz>"` plus `meta.calendarStats`. Bei MOCK=1 kein Sync. Optional Request-Feld `sync: false` → überspringen.
> Selbsttest `gcal.check.ts` (`node:assert`, nur relative Imports, JSON per `fs`, ohne Netz): Startplan → richtige Anzahl Events (Kurs-Termine + 2 feste), erster Dienstag-Termin `2026-10-27T10:00:00`, RRULE mit `UNTIL=20270205T225959Z`, IDs stabil (2× gleich) und gültig (`/^[a-v0-9]{5,}$/`), Änderung `stat-u1 → stat-u2` ändert genau eine ID.
> Fertig, wenn: Selbsttest grün, `npm run typecheck && npm run lint` grün, `/api/act` ohne Google-Env liefert `meta.calendar: "off"`, `/api/google/login` ohne Client-ID → verständlicher Fehler, mit Client-ID → Redirect-URL korrekt (per `curl -sI` prüfen). Echter Test mit Zugang (Lenny legt den OAuth-Client an, siehe `docs/backend.md` → „Google-Kalender einrichten"): anmelden → Startplan → 11 Termine im Kalender „Stundenplan", Do 14–16 sperren → nur Statistik-Übung springt auf Freitag.
> Nicht anfassen: `solver.ts`, `/api/analyze`, `types.ts`. Kein `npm run build`, kein Commit.

### TASK-014 · Stundenplan-Erstellung: Studiengang + Semester
- Bereich: B/C · Modell: sonnet · Prio: Feature
- Status: erledigt (nicht committet)
> Ziel: Ein Plan wird für einen Studiengang und ein Fachsemester erstellt, nicht aus allen Kursen. Pro Studiengang eine Datei `src/data/<id>.json` (`CourseData` mit `program: { id, name }`, Kurse mit `term`). `src/data/courses.json` wird zu `src/data/demo.json` (program `{ id: "demo", name: "Demo (Pitch)" }`, alle Kurse `term: 1`) – das ist der Demo-Datensatz mit vollem Dienstag.
> Dateien: `src/data/index.ts` (neu), `src/data/demo.json` (umbenannt), `src/app/api/programs/route.ts` (neu), `src/app/api/act/route.ts`, `src/app/api/analyze/route.ts`, `src/features/act/gcal.ts` und alle `*.check.ts`, die `courses.json` lesen (nur Pfad/Import anpassen).
> - `src/data/index.ts`: `PROGRAMS: Record<string, CourseData>` (statische JSON-Imports, neue Studiengänge = eine Zeile), `getProgram(id = "demo")`, `selectCourses(data, { term?, courseIds? }): CourseData` (courseIds gewinnt, sonst alle mit `term`, sonst alle).
> - `GET /api/programs` → `[{ id, name, terms: number[] }]` fürs Frontend (Dropdowns Studiengang/Semester).
> - `/api/act` und `/api/analyze`: zusätzliche Request-Felder `program?`, `term?`, `courseIds?` → mit `selectCourses` filtern, sonst Verhalten wie bisher (demo, alle Kurse). Gemma bekommt nur die ausgewählten Kurse.
> Fertig, wenn: alle Selbsttests grün, `npm run typecheck && npm run lint` grün, `curl /api/programs` listet `demo`, `POST /api/act {"program":"demo"}` = bisheriger Startplan, `POST /api/act {"program":"demo","courseIds":["mathe1","stat"]}` plant nur diese zwei.
> Nicht anfassen: `solver.ts`, `types.ts`, Frontend. Kein `npm run build`, kein Commit.

### TASK-015 · Echte Kursdaten BWL (dann VWL, WiFo)
- Bereich: A · Modell: haiku · Prio: Feature · Wer: Emil
- Status: offen
> Ziel: Echte Termine der Uni als `src/data/bwl.json` (später `vwl.json`, `wifo.json`), genau im Format von `src/data/courses.json` bzw. `CourseData` in `src/lib/types.ts`. `backend/bwl_courses.json` ist bisher leer – dort nichts weiter pflegen.
> Format pro Datei: `{ "program": { "id": "bwl", "name": "BWL (B.Sc.)" }, "semester": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" }, "courses": [ { "id": "kurz-und-eindeutig", "name": "…", "required": true, "ects": 6, "exam": true, "term": 1, "groups": [ { "id": "<kurs>-v", "kind": "Vorlesung", "sessions": [ { "day": "Mo", "start": "10:15", "end": "11:45", "room": "…" } ] }, { "id": "<kurs>-u1", "kind": "Übung", "sessions": [ … ] } ] } ], "fixed": [] }`.
> Regeln: Tage `Mo|Di|Mi|Do|Fr|Sa|So`, Zeiten `HH:MM` 24 h; jede parallele Übung/jedes Tutorium = eigene Gruppe; Vorlesung mit mehreren Terminen pro Woche = eine Gruppe mit mehreren `sessions`; `term` = empfohlenes Fachsemester; für die Demo reicht **ein Semester** (z. B. 1. Semester BWL, 5–7 Kurse). In `src/data/index.ts` (TASK-014) eine Zeile ergänzen.
> Fertig, wenn: `node -e "JSON.parse(require('fs').readFileSync('src/data/bwl.json','utf8'))"` läuft und `POST /api/act {"program":"bwl","term":1}` einen Plan liefert.
> Nicht anfassen: Code außerhalb von `src/data/`.

### TASK-016 · Gemma bleibt geladen + Warmup
- Bereich: B · Modell: sonnet · Prio: P1 (Demo-Stabilität)
- Status: erledigt (nicht committet)
> Problem: Ollama wirft das Modell nach 5 Min ohne Anfrage aus dem Speicher → nächster Satz in der Demo dauert 30–70 s. Requests über den OpenAI-kompatiblen Endpunkt setzen den Timer wieder auf 5 Min.
> Ziel: `scripts/warmup.sh` + `"warmup"` in `package.json`: prüft, ob Ollama läuft und `gemma4:e4b` da ist, setzt auf macOS `launchctl setenv OLLAMA_KEEP_ALIVE -1` (Hinweis ausgeben: Ollama-App einmal neu starten, damit es greift), schickt dann eine kurze Anfrage an `POST /api/generate` mit `"keep_alive": -1` und misst die Zeit, zeigt am Ende `ollama ps`. Zusätzlich in `src/lib/ai.ts` für Provider `ollama` den nativen Parameter durchreichen, falls der OpenAI-kompatible Endpunkt ihn annimmt (prüfen: `keep_alive` im Body; wenn nicht unterstützt, nichts ändern und das im Bericht sagen).
> Dateien: `scripts/warmup.sh`, `package.json` (nur Script-Eintrag), ggf. `src/lib/ai.ts` (nur Ollama-Zweig), `docs/backend.md` (Abschnitt „Vor der Demo": `npm run warmup`).
> Fertig, wenn: `npm run warmup` lädt das Modell, `ollama ps` zeigt `UNTIL Forever` (oder es ist dokumentiert, warum nicht und was stattdessen zu tun ist).
> Nicht anfassen: Routen, `types.ts`. Kein `npm run build`, kein Commit.

### TASK-017 · Gewichte merken + JSON-Retry
- Bereich: B · Modell: sonnet · Prio: P1
- Status: erledigt (nicht committet)
> Problem 1: Sagt die Nutzerin „Statistik ist mir egal" und danach „Ich will dienstags frei", liefert Gemma beim zweiten Satz wieder Standardgewichte → Statistik springt zurück auf 3.
> Problem 2: Liefert Gemma einmal kein gültiges JSON, bricht die Demo mit 502 ab.
> Ziel: `/api/analyze` nimmt optional `priorities?: Priority[]` (aktueller Stand aus dem Frontend). Diese gehen als `Current weights: <json>` in den User-Prompt; in `ANALYZE_SYSTEM` eine Regel ergänzen: „If current weights are given, keep them unless the student changes that course in this sentence." In `clean()` zusätzlich: fehlt ein Kurs in Gemmas Antwort → aktuelles Gewicht statt Standard. Bei ungültigem JSON genau **einmal** neu fragen (gleicher Prompt + Hinweis „Your last answer was not valid JSON."), erst dann 502.
> Dateien: `src/app/api/analyze/route.ts`, `src/lib/prompts.ts` (nur `ANALYZE_SYSTEM`).
> Fertig, wenn: `npm run typecheck && npm run lint` grün; mit Ollama (Dev-Server auf eigenem Port): Satz 1 „Statistik ist mir egal" → stat 1; Satz 2 „Ich will dienstags frei haben" mit `priorities` aus Satz 1 → stat bleibt 1. Die 6 Sätze aus TASK-006 funktionieren weiter.
> Nicht anfassen: `/api/act`, `src/features/act/`, `types.ts`. Kein `npm run build`, kein Commit.

### TASK-018 · Einmaliger Termin → Ausweichtermin diese Woche
- Bereich: B/C · Modell: sonnet · Prio: Feature (Use Case 2 aus `docs/konzept.md`: „schlägt Ausweichtermine für verpasste Veranstaltungen vor")
- Status: gestrichen (Rückfrage aus Prompt entfernt, immer wöchentlich)
> Problem: Wählt die Nutzerin bei der Rückfrage „Nur nächsten Donnerstag", behandelt der Planer den Termin trotzdem als jede Woche und verschiebt dauerhaft.
> Ziel: `Constraint.date?: string` (ISO, nur dieser Tag; Lenny ergänzt den Typ). Gemma setzt `date` bei einmaligen Terminen (Prompt bekommt `Today: <Tag> <YYYY-MM-DD>`). Planer: Constraints mit `date` ändern den Wochenplan **nicht**; für jeden gewählten Termin, der sie schneidet, sucht er andere Gruppen desselben Kurses/derselben Art in **derselben Woche**, die nicht kollidieren → `plan.alternatives` mit `reason: "Nur diese Woche: statt Do 14:00–16:00"` und `plan.missed` (neu, Lenny ergänzt den Typ) mit Kurs/Termin/Datum. Kalender (`gcal.ts`): die betroffene Instanz des wöchentlichen Events absagen (Instanz-ID `<eventId>_<YYYYMMDDTHHMMSSZ>` per `PUT`/`PATCH` mit `status: "cancelled"`) und den Ausweichtermin als Einzeltermin anlegen. `describeChanges` erwähnt es („Diese Woche fällt Statistik Übung am Donnerstag aus – Ausweichtermin Freitag 12 Uhr").
> Dateien: `src/lib/prompts.ts`, `src/app/api/analyze/route.ts`, `src/features/act/solver.ts` (+ check), `src/features/act/gcal.ts` (+ check), `src/features/voice/describe.ts` (+ check).
> Fertig, wenn: alle Selbsttests grün (neuer Fall: einmaliger Do-14–16-Termin → Plan unverändert, Alternative stat-u2 am Freitag derselben Woche), typecheck/lint grün, mit Ollama: „Nächsten Donnerstag 14 bis 16 Uhr habe ich einen Arzttermin" + Klarstellung „Nur nächsten Donnerstag" → `date` gesetzt.
> Nicht anfassen: Frontend. Kein `npm run build`, kein Commit.

### TASK-019 · Selbsttests in den Check
- Bereich: – · Modell: haiku · Prio: P2
- Status: erledigt (nicht committet)
> Ziel: `"test"` in `package.json` führt alle `src/**/*.check.ts` mit `node` aus (z. B. `for f in $(find src -name '*.check.ts'); do node "$f" || exit 1; done` in einem kleinen `scripts/test.sh`); `scripts/check.sh` bekommt `run "tests" npm run --silent test`.
> Fertig, wenn: `bash scripts/check.sh` zeigt ✅ tests.
> Nicht anfassen: die Check-Dateien selbst.

### TASK-011 · `scripts/voice.py` aufräumen
- Bereich: D · Modell: haiku · Prio: Feature
- Status: erledigt (Audio über Gemma, siehe `/api/analyze { audio }`); `scripts/voice.py` kann gelöscht werden
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
