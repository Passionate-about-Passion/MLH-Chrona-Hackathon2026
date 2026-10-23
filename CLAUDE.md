# Hackathon-Projekt – Regeln für Claude

Ziel: Den Hackathon gewinnen. Die Jury entscheidet nach Pitch und Demo, nicht nach Code.
Lies bei jedem Start: dieses File, `docs/scope.md`, `docs/decisions.md`, `docs/interfaces.md`, `docs/ROLLEN.md`.
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
