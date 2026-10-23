# Hackathon-Projekt – Regeln für Claude

Ziel: Den Hackathon gewinnen. Die Jury entscheidet nach Pitch und Demo, nicht nach Code.
Lies bei jedem Start: dieses File, `docs/scope.md`, `docs/decisions.md`, `docs/interfaces.md`, `docs/ROLLEN.md`, `BUGS.md` (offene P0/P1) und `PROMPT.md` (offene Aufgaben).
Hintergrundwissen (Jury, Pitch, Zeitplan): `docs/playbook.md`, `docs/ABLAUF.md` – nur bei Bedarf lesen.

## Projekt (vom Team auszufüllen, in der ersten Stunde)
- Event: Hacktoberfest Hack Day Mannheim x Q-Summit, Sa 24.10.2026, MAFINEX Mannheim
- Challenges: „Best Use of Gemma 4" (Google) + „Best Open-Source AI Project" (DigitalOcean)
- Lösung in einem Satz: TODO
- Persona (Nutzer): TODO
- Jury: TODO · Abgabe: **16:45** · Pitch ab 17:00 · Pitch-Dauer: TODO
- Stack: Next.js 15 (App Router) + TypeScript + Tailwind 4 · Gemma 4 über Gemini API / DigitalOcean Inference / Ollama · ElevenLabs (optional)

## Besitzer pro Bereich (nur im eigenen Bereich arbeiten)
Jede Person baut ihren Bereich vom Backend bis zum Frontend (Details: `docs/ROLLEN.md`).

| Bereich | Dateien | Besitzer |
|---|---|---|
| A · Erfassen | `src/features/capture/`, Input-Teil von `src/app/api/analyze/`, `public/samples/` | TODO (Pitcher) |
| B · Verstehen | `src/features/understand/`, `src/app/api/analyze/`, `src/lib/ai.ts`, `ANALYZE_SYSTEM` in `src/lib/prompts.ts` | TODO |
| C · Handeln | `src/features/act/`, `src/app/api/act/`, `ACT_SYSTEM` in `src/lib/prompts.ts` | TODO |
| D · Sprechen & Lokal | `src/features/voice/`, `src/app/api/speak/` | TODO |
| Gemeinsam (nur nach Ansage) | `src/lib/types.ts`, `src/app/page.tsx`, `src/app/layout.tsx` | alle |
| Pitch | `docs/pitch.md` | TODO (Pitcher) |

## Regeln
1. Pitch-getrieben: Baue nur, was in der Demo gezeigt wird. Maximal 1–2 Kernfeatures laut `docs/scope.md`. Wünscht der Nutzer etwas Neues, frage zuerst: "Kommt das in die Demo?" Wenn nein, rate ab.
2. `main` muss immer lauffähig sein. Vor jedem Commit: `npm run lint && npm run typecheck && npm run build` (der Pre-Commit-Hook prüft Lint und Typen).
3. Zuerst `git pull`, dann arbeiten. Kleine Commits, oft pushen (Ablauf: `docs/GIT-WORKFLOW.md`).
4. Ändere keine Dateien in fremden Bereichen. Brauchst du dort etwas, sag dem Nutzer, dass er es mit dem Besitzer klärt.
5. Schnittstellen stehen in `src/lib/types.ts` und `docs/interfaces.md`. Änderungen nur nach Absprache im Team.
6. Getroffene Entscheidungen hängst du an `docs/decisions.md` an (Datum, Entscheidung, Grund). Nichts löschen.
7. Einfach halten. Kein Overengineering, keine unnötigen Integrationen, keine neuen Tools ohne Teambeschluss.
8. Keine Secrets im Repo. Keys gehören in `.env.local` (steht in `.gitignore`), Platzhalter in `.env.example`.
9. Steckt der Nutzer fest oder ist eine Aufgabe zu groß, sag das früh und offen.
10. Nach dem Scope-Freeze (14:00, siehe `docs/scope.md`): nur noch Bugfixes und Demo-Stabilität, keine neuen Features.
11. Solange keine Keys da sind: `MOCK=1` in `.env.local`. Frontend gegen die Mock-Antworten in `src/lib/mocks.ts` bauen. Vor der Demo `MOCK=0`.
12. Alle KI-Aufrufe laufen über `ask()` in `src/lib/ai.ts`. Keine direkten SDK-Aufrufe in Routen oder Komponenten.
13. Neue Aufgaben schreibst du als Prompt in `PROMPT.md` (Vorlage dort, oder `/new-task`). Gefundene Bugs gehören in `BUGS.md`, nicht nur in den Chat.

## Routinen

| Wann | Was | Wie | Wer |
|---|---|---|---|
| **alle 30 Min.** | Bug-Check: Lint, Typecheck, Build, Änderungen prüfen → `BUGS.md`, offene P0/P1 → `PROMPT.md` | `/loop 30m /bugcheck` einmal starten | **nur Bereich B** (Integration), damit keine doppelten Einträge entstehen |
| vor jeder Aufgabe | `git pull`, nächste Aufgabe holen | `/next-task <A-D>` | alle |
| neue Idee / Wunsch | als Prompt festhalten statt sofort bauen | `/new-task <text>` | alle |
| vor jedem Commit | Check muss grün sein | `bash scripts/check.sh` | alle |
| zu jeder vollen Stunde | eigenen Branch in `main` mergen | siehe `docs/GIT-WORKFLOW.md` | alle |
| 14:00 | Scope-Freeze: `task-writer` lehnt ab hier Feature-Aufgaben ab | – | A sagt es an |
| ab 15:30 | `/bugcheck` alle 15 Min., nur noch P0/P1 fixen | `/loop 15m /bugcheck` | B |

P0-Bugs (Demo kaputt) sofort im Team-Chat melden, nicht auf den nächsten Check warten.

## Modellwahl (abgestuft)

Nimm das kleinste Modell, das die Aufgabe sicher schafft. Jede Aufgabe in `PROMPT.md` nennt ihr Modell.

| Modell | Wofür | Beispiele |
|---|---|---|
| **Opus** (Hauptsession) | Schwer & riskant | Vertrag `types.ts` ändern, mehrere Bereiche betroffen, Gemma-Prompts entwerfen, unklarer P0, Merge-Konflikte |
| **Sonnet** (mittel) | Normale Arbeit in einem Bereich | Komponente bauen, API-Route erweitern, P1/P2-Bug fixen, Bug-Analyse (`bug-hunter`), Umsetzung (`slice-builder`) |
| **Haiku** (einfach) | Mechanisch & klein | Checks laufen lassen (`check-runner`), Aufgaben/Bugs eintragen (`task-writer`), Texte, Docs, Umbenennen |

Subagents mit festem Modell liegen in `.claude/agents/`, Befehle in `.claude/commands/`. Delegiere Haiku- und Sonnet-Arbeit an diese Subagents statt sie in einer Opus-Session selbst zu machen.

## Skills
Projekt-Skills liegen in `.claude/skills/` (Übersicht: `SKILLS.md`). Pflicht:
- Bugs: `systematic-debugging` · vor „fertig“: `verification-before-completion`
- UI: `frontend-design`, bei Browser-APIs/CSS zuerst `modern-web-guidance`
- Aufgaben über mehr als 2 Dateien: `writing-plans` (Plan kurz, Ergebnis als Aufgaben in `PROMPT.md`)
