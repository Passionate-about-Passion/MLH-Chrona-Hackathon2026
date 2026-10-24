# Übergabe an die nächste Claude-Sitzung (Backend Stundenplan, Lenny)

Kopiere alles ab „Prompt" in eine neue Claude-Code-Sitzung im Projektordner.

---

## Prompt

Du übernimmst das Backend des KI-Stundenplan-Assistenten (Hackathon, Sa 24.10.2026, Abgabe 16:45, Scope-Freeze 14:00). Ich bin Lenny und besitze das Backend. Das Frontend baut eine andere Person (TASK-009), fass es nicht an.

**Zuerst lesen:** `CLAUDE.md`, `docs/backend.md` (Architektur, Google-Setup, „Vor der Demo"), `PROMPT.md` (Übersichtstabelle oben = Stand aller Aufgaben), `docs/interfaces.md`, `src/lib/types.ts`.

**Git:** Arbeitsbranch `lenny/stundenplan`. `main` steht auf `4da3e04`. Der Branch hat zusätzlich den Google-Sync-Commit. Vor jedem Merge nach `main`: `bash scripts/check.sh` (lint, typecheck, `npm test`, build) muss grün sein, dann `git checkout main && git pull --ff-only && git merge --ff-only lenny/stundenplan && git push`. Kein Force-Push. `scripts/voice.py` ist bewusst nicht committet (TASK-011).

**Architektur in einem Satz:** Sprache → Text (iPhone/Browser) → `POST /api/analyze` (Gemma 4 E4B lokal über Ollama: Sperrzeiten hart/Wunsch, Gewichte 1–3 mit Begründung, Rückfragen, Abfrage-Intent) → `POST /api/act` (TS-Backtracking-Planer `src/features/act/solver.ts`, die KI steuert ihn über Constraints und Gewichte) → Plan + sofortiger Google-Kalender-Sync (`src/features/act/gcal.ts`) → Vorlesen über `/api/speak` (ElevenLabs, Text aus `src/features/voice/describe.ts`).

**Umgebung:** `.env.local` existiert (nicht committen, nicht ausgeben): `AI_PROVIDER=ollama`, `OLLAMA_MODEL=gemma4:e4b`, `MOCK=0`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/callback` sind gesetzt. Kein ElevenLabs-Key (→ 501 → Browser-Stimme, okay). Ollama läuft, vor Tests `npm run warmup` (Modell bleibt dann geladen, sonst 30–70 s Kaltstart).

### Nächste Schritte, in dieser Reihenfolge

1. **Google-Sync live testen (TASK-013, Code fertig, ungetestet gegen Google).**
   - `npm run dev` (Port **3000**, die Redirect-URI hängt daran).
   - `curl -sI localhost:3000/api/google/login` → 307 auf `accounts.google.com` mit `access_type=offline`.
   - Lenny öffnet `http://localhost:3000/api/google/login` im Browser, meldet sich an („App nicht verifiziert" → Weiter). Callback legt Kalender „Stundenplan" an, speichert Token in `.data/google.json` (gitignored) und trägt den Startplan ein (12 wöchentliche Termine ab 26.10.2026).
   - `curl -s localhost:3000/api/google/status` → `connected: true`.
   - Sperrzeit testen: `curl -s -X POST localhost:3000/api/act -H 'content-type: application/json' -d '{"constraints":[{"type":"block","day":"Do","start":"14:00","end":"16:00","label":"Fester Termin","hard":true}],"current":[<chosen aus dem Startplan>]}'` → `meta.calendar: "synced"`, `calendarStats` ≈ 2 neu (Statistik-Übung Fr + fester Termin), 1 gelöscht. Lenny prüft im Google Kalender.
   - Fehler stehen in `meta.calendar` (`error: …`) und im Server-Log `[gcal]`. Häufige Ursachen: Testnutzer fehlt im Zustimmungsbildschirm, Calendar API nicht aktiviert, Redirect-URI weicht ab.
   - Danach: TASK-013 in `PROMPT.md` auf erledigt setzen, committen, nach `main` mergen (siehe Git).
2. **TASK-014 Studiengang + Semester** (Spezifikation in `PROMPT.md`). Achtung: `gcal.ts`, `/api/google/callback`, `/api/act`, `/api/analyze` und die `*.check.ts` importieren `src/data/courses.json` – beim Umbenennen nach `demo.json` alle mitziehen.
3. **TASK-018 einmaliger Termin → Ausweichtermin diese Woche** (Spezifikation in `PROMPT.md`). Riskantestes Stück; wenn es nach 14:00 wird: weglassen und stattdessen im Prompt die Rückfrage „nur nächsten oder jeden" entfernen (dann immer wöchentlich).
4. **TASK-010/011:** Ergebnis des Audio-Tests (versteht `gemma4:e4b` Audio über Ollama?) ist unbekannt – kurz neu testen (macOS `say -v Anna -o t.aiff "…"`, `ffmpeg -i t.aiff -ar 16000 -ac 1 t.wav`, an `/api/chat` mit `images:[base64]` oder `/v1/chat/completions` mit `input_audio`). Danach `scripts/voice.py` löschen oder umbauen.
5. **TASK-015 (Emil):** echte BWL-Daten kommen nach `src/data/bwl.json` im `CourseData`-Format; `backend/bwl_courses.json` ist leer. Nur einbinden, wenn TASK-014 steht.

### Regeln, die schon gelten
- Nur Backend. Frontend (TASK-009) gehört jemand anderem; Schnittstellen in `docs/interfaces.md`, neue Felder dort und in `types.ts` nachziehen.
- `types.ts` nur ergänzen (optionale Felder), nichts umbenennen – das Frontend baut parallel dagegen.
- KI-Aufrufe nur über `ask()` in `src/lib/ai.ts`. Der Planer und der Antworttext für „Welche Termine habe ich?" sind bewusst KI-frei.
- Neue Aufgaben/Bugs in `PROMPT.md` bzw. `BUGS.md`, Entscheidungen an `docs/decisions.md` anhängen.
- Ein Hook („Fact-Forcing Gate") verlangt vor dem ersten Schreiben jeder Datei kurz: wer sie aufruft, betroffene API/Daten, die Anweisung wörtlich – dann denselben Aufruf wiederholen.
- Subagents: Haiku für Mechanisches, Sonnet für normale Aufgaben; nie zwei Agents auf dieselbe Datei; Agents committen nicht, das macht die Hauptsitzung nach `bash scripts/check.sh`.
- Antworten an Lenny auf Deutsch, kurz.
