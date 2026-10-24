# Backend-Plan · KI-Stundenplan-Assistent

## Was die Nutzerin sagt und was passiert

| Sie sagt | Gemma macht daraus | Planer macht |
|---|---|---|
| „Donnerstag 14–16 Uhr habe ich einen Termin" | Sperrzeit Do 14–16, **fest** | Alles, was Do 14–16 liegt, in eine andere Gruppe verschieben |
| „Ich will dienstags frei haben" | Sperrzeit Di ganztägig, **Wunsch** | Möglichst alles vom Dienstag wegverschieben. Geht ein wichtiges Modul nur dienstags (z. B. die einzige Vorlesung), bleibt es und die App sagt warum |

**Wie der Stundenplan entsteht:**
1. **Daten:** Pro Studiengang eine Datei `src/data/<id>.json` (BWL, später VWL, WiFo; dazu `demo.json` für den Pitch) mit allen Kursen, allen parallelen Gruppen, empfohlenem Fachsemester (`term`) und Semesterzeitraum.
2. **Auswahl:** Die Nutzerin wählt Studiengang und Fachsemester (`GET /api/programs`), optional einzelne Kurse ab- oder zuwählen.
3. **Startplan:** `POST /api/act { program, term }` – der Planer wählt aus allen Gruppen der ausgewählten Kurse einen konfliktfreien Plan mit den festen Terminen (`fixed`) und den Standardgewichten.
4. **Google Kalender:** derselbe Request schreibt den Plan sofort in den Kalender „Stundenplan" (OAuth).
5. **Ändern per Sprache:** jede Aussage geht über Gemma → Planer → Kalender (siehe Tabelle oben).

Bisher (vor TASK-014): alle Kurse aus `courses.json`. Sagt die Nutzerin gleich am Anfang etwas („Montags habe ich Fußball, Mathe ist mir wichtig"), steuert Gemma den ersten Plan genauso wie jede spätere Änderung. **Ausgabe:** Wochenansicht in der App und **live im Google Kalender**: `/api/act` schreibt nach jeder Berechnung die Termine (wöchentlich bis Semesterende) in den Kalender „Stundenplan". Unveränderte Termine bleiben stehen, nur verschobene werden gelöscht und neu angelegt.

### Google-Kalender einrichten (einmalig, ca. 10 Min, OAuth)
1. https://console.cloud.google.com → neues Projekt → „APIs & Dienste" → Bibliothek → **Google Calendar API** aktivieren.
2. „Google Auth Platform" (OAuth-Zustimmungsbildschirm): App-Name, Support-E-Mail, Zielgruppe **Extern**, Status **Test**. Unter „Zielgruppe" → **Testnutzer**: die Google-Konten eintragen, die in der Demo angemeldet werden.
3. „Datenzugriff" → Bereich hinzufügen: `https://www.googleapis.com/auth/calendar`.
4. „Clients" → Client erstellen → Typ **Webanwendung** → Autorisierte Weiterleitungs-URI: `http://localhost:3000/api/google/callback` (später zusätzlich die Deployment-URL).
5. Client-ID und Client-Secret **selbst** in `.env.local` eintragen (nicht in den Chat): `GOOGLE_CLIENT_ID=…`, `GOOGLE_CLIENT_SECRET=…`, `GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback`.
6. App starten, `http://localhost:3000/api/google/login` am Laptop öffnen, anmelden. Die App legt den Kalender „Stundenplan" selbst an.
7. In der Google-Kalender-App auf dem Handy den Kalender „Stundenplan" einblenden.

In beiden Fällen zeigt die App, **was sich geändert hat** („Übung Statistik: Di 10–12 → Do 8–10"), und liest es auf Wunsch vor.

Datenfluss:

```
Sprache ──► D Sprechen ──(Text)──► B /api/analyze ──(Constraints)──► C /api/act ──(Plan)──► Kalender-UI
                                                                         ▲
                                       A Termin-Daten (courses.json) ────┘
```

## Vorschlag für den Vertrag (`src/lib/types.ts`, gemeinsam festlegen)

```ts
type Day = "Mo" | "Di" | "Mi" | "Do" | "Fr" | "Sa" | "So";
Session    { day: Day; start: string; end: string; room?: string }        // "14:00"
Group      { id: string; kind: "Vorlesung" | "Übung" | "Tutorium"; sessions: Session[] }
Course     { id: string; name: string; required: boolean; ects: number; exam: boolean; groups: Group[] }                // pro kind genau 1 Gruppe wählen
Constraint { type: "block"; day: Day; start: string; end: string; label: string;
             hard: boolean }                                               // true = fester Termin, false = Wunsch („frei haben")
Priority   { courseId: string; weight: 1 | 2 | 3; reason: string }        // 3 = sehr wichtig, von Gemma bestimmt
Plan       { chosen: { courseId: string; groupId: string }[];
             dropped: string[];                                            // courseIds, die weichen mussten (unwichtigste zuerst)
             conflicts: string[];                                          // was nicht passt
             alternatives: { courseId: string; groupId: string; reason: string }[];
             changes: { courseId: string; from: string; to: string }[] }   // „Di 10–12" → „Do 08–10", für UI und Vorlesen
```

## Aufgaben pro Bereich

### A · Erfassen – Termin-Daten
- `src/data/courses.json`: 4–5 echte Kurse mit je 2–3 Übungs-/Tutoriumsgruppen (von Hand gepflegt, kein Scraper). Pro Kurs Pflicht/Wahl, ECTS und Prüfung ja/nein eintragen, daraus leitet Gemma die Gewichtung ab.
- Hobbys und feste private Termine als `Constraint[]` in derselben Datei (Startwoche der Demo).
- Keine Datenbank: Die JSON-Datei ist die „Datenbank" (laut Scope ist die App zustandslos).

### B · Verstehen – Gemma 4: Text → Constraints
- `ANALYZE_SYSTEM`: Ein Satz wie „Donnerstag 14–16 Uhr habe ich einen festen Termin" wird zu `{ constraints: Constraint[] }`. Termin, Arbeit, Hobby → `hard: true`; „frei haben", „lieber nicht" → `hard: false`.
- `/api/analyze`: nimmt `note` (Text), gibt `{ constraints, meta }` zurück. JSON validieren, bei ungültiger Antwort `400`.
- **Gewichtung durch das Modell:** Gemma bekommt die Kursliste (Name, Pflicht/Wahl, ECTS, Prüfung ja/nein) und das, was die Nutzerin sagt („Mathe ist mir super wichtig"), und vergibt pro Kurs `Priority` (1–3) mit kurzer Begründung. Die Antwort enthält also `{ constraints, priorities }`. Ohne Aussage der Nutzerin gilt: Pflicht + Prüfung = 3, Pflicht = 2, Wahl = 1.
- Die Begründung (`reason`) zeigt die UI an, damit die Jury sieht, *warum* ein Modul gewonnen hat.
- Mock in `src/lib/mocks.ts` für genau den Demo-Satz.
- Läuft über `ask()` in `src/lib/ai.ts` (Regel 12).

### C · Handeln – Planer
- `/api/act`: nimmt `{ constraints, priorities, current }` (`current` = bisheriger Plan), lädt `courses.json`, gibt `{ plan, meta }` zurück.
- Solver in TypeScript: alle Gruppen-Kombinationen durchprobieren (Backtracking). Ein Kurs darf auch „weggelassen" werden. Bewertung pro Plan:
  - Überschneidung untereinander oder mit **festem** Termin (`hard`) → Plan ungültig.
  - Punkte = Summe der Gewichte der eingeplanten Kurse. So setzen sich sehr wichtige Module durch, unwichtige landen in `dropped`.
  - Überschneidung mit einem **Wunsch** (`hard: false`) → Abzug von 0,5 pro Termin. Ein Modul mit Gewicht ≥ 1 schlägt also immer einen Wunsch, aber eine Ausweichgruppe ohne Überschneidung wird bevorzugt.
  - Gleichstand → der Plan mit den **wenigsten Änderungen** gegenüber `current` gewinnt. Sonst würfelt der Planer bei jeder Änderung die ganze Woche neu.
- `changes`: Unterschied `current` → neuer Plan, als lesbare Zeitangaben.
- Ausweichtermine: Fällt eine Gruppe durch einen neuen Constraint weg, die anderen Gruppen desselben Kurses vorschlagen, die noch passen. Wichtige Kurse zuerst.
- Kleiner Selbsttest (`assert`): 2 Kurse, die sich überschneiden (Gewicht 3 und 1), plus 1 Block. Erwartet: Kurs mit Gewicht 3 bleibt drin, der andere steht in `dropped`.

### D · Sprechen – Sprache rein, Ergebnis raus
- Speech-to-Text im Browser (Web Speech API, `de-DE`). Der Text geht an `/api/analyze`, dafür ist kein Backend nötig.
- `/api/speak`: Zusammenfassung der Änderung vorlesen („Übung Mathe verschoben auf Freitag 10 Uhr").

## Abweichungen vom Konzept (bitte im Team entscheiden)
- **OR-Tools CP-SAT → TS-Backtracking.** CP-SAT braucht einen Python-Dienst neben Next.js. Bei ~5 Kursen × 3 Gruppen gibt es rund 250 Kombinationen, die eine Schleife in Millisekunden prüft. CP-SAT lohnt sich erst bei Hunderten Kursen oder Optimierungszielen (z. B. „möglichst wenige Lücken").
- **IBM Granite Speech → Web Speech API.** Granite braucht Python und einen Modell-Download. Im Pitch als „Ausbaustufe, komplett Open Source" nennen, in der Demo den Browser nutzen.
- **Datenbank → JSON-Datei.** Reicht für die Demo, `docs/scope.md` schließt eine DB ohnehin aus.

## Vor der Demo
`npm run warmup` lädt `gemma4:e4b` und hält es im Speicher (`keep_alive: -1`, `ollama ps` zeigt `UNTIL Forever`). Setzt außerdem `OLLAMA_KEEP_ALIVE=-1` per `launchctl`; das gilt erst nach einem Neustart der Ollama-App. `ask()` schickt `keep_alive: -1` auch bei jeder Anfrage über `/v1` mit.

**iPhone mit Mikro: `npm run phone`** (HTTPS-Proxy auf Port 3443 vor `localhost:3000`, Zertifikate in `.data/https/`). Einmalig am iPhone:
1. `https://<Mac-IP>:3443/ca.crt` in Safari öffnen, Profil laden.
2. Einstellungen › Allgemein › VPN und Geräteverwaltung › Profil installieren.
3. Einstellungen › Allgemein › Info › Zertifikatsvertrauenseinstellungen › „Hacktober26 Dev CA“ voll vertrauen.
4. `https://<Mac-IP>:3443` öffnen. Ändert sich die IP, erzeugt das Skript das Server-Zertifikat neu (CA bleibt).
