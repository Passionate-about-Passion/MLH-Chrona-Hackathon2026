# Hacktober26

> **An AI timetable assistant for students:** it combines lectures, exercises and tutorials with private appointments and hobbies into a conflict-free schedule and re-plans by voice when things change. Concept: [`docs/konzept.md`](docs/konzept.md)

Built in one day at **Hacktoberfest Hack Day Mannheim x Q-Summit** (24 Oct 2026) with **Gemma 4**, Google's open-weight model.

## How it works

```
Photo / note ──► Capture ──► Understand (Gemma 4) ──► Act (Gemma 4 + Google Search) ──► Speak (ElevenLabs)
```

- **Open-weight AI at the core:** every step runs on Gemma 4 (`gemma-4-26b-a4b-it` / `gemma-4-31b-it`).
- **Runs where you want it:** Gemini API, DigitalOcean Inference, or fully local via Ollama (Gemma 4 E4B) so sensitive data never leaves the device.
- **Multimodal:** understands photos of real-world documents, not just text.

## Stundenplan-UI-Mockup

Die App plant für Studierende den Stundenplan. Vorlesungen, Übungen und Tutorien werden einmal importiert und mit privaten Terminen und Hobbys zu einem Plan ohne Überschneidungen kombiniert. Wichtige Kurse werden bei Konflikten bevorzugt, weil jeder Kurs eine Wichtigkeit von 1 bis 5 hat. Bei einem Konflikt zeigt die App Alternativen nebeneinander und ändert nichts ohne Bestätigung. Spontane Änderungen sagt man per Sprache, die App legt die Woche neu.

Der Prototyp ist ein klickbares Mockup mit erfundenen Beispieldaten, ohne Backend. Er läuft unter `/mockup` und ist für ein iPhone-Format (390 × 844) gebaut.

```bash
npm install
npm run dev     # dann http://localhost:3000/mockup öffnen
```

| Pfad | Inhalt |
|------|--------|
| `src/app/mockup/page.tsx` | Route des Mockups |
| `src/components/timetable/` | Oberfläche: Tagesansicht, Regler, Dialoge, Lernplan, `timetable.css` |
| `src/types.ts` | Datenmodell (Course, Group, Session, Entry) |
| `src/data/sample.ts` | Beispielkurse, -gruppen und -termine |
| `src/voice/` | Schnittstelle `VoiceService` und Mock-Implementierung |

Die Sprachfunktion (Speech-to-Text, Sprachverständnis, Text-to-Speech) wird nur in `src/voice/` eingebaut: [`docs/voice-integration.md`](docs/voice-integration.md)

## Quick start

```bash
git clone https://github.com/Passionate-about-Passion/Hacktober26.git
cd Hacktober26
bash setup.sh                # Claude-Code-Plugins & Skills holen (einmal pro Rechner)
npm install
cp .env.example .env.local   # MOCK=1 works without any keys
```

- `setup.sh` installiert das Team-Plugin, superpowers, context7, frontend-design und typescript-lsp und kopiert lose Skills nach `~/.claude/skills/`. Mehrfach ausführbar. Danach Claude Code neu starten und mit `claude plugin list` prüfen.
- Windows: `setup.sh` in **Git Bash** oder **WSL** ausführen.
- Solange der Branch noch nicht auf `main` ist: `bash setup.sh --local`.
- Für typescript-lsp einmalig: `npm i -g typescript-language-server typescript`.

## Mit Gemma arbeiten

1. Key holen: https://aistudio.google.com/apikey → in `.env.local` eintragen: `GEMINI_API_KEY=…` und `MOCK=0`
2. Testen: `npm run test:gemma` (mit eigenem Foto: `npm run test:gemma -- gemini pfad/zum/foto.jpg`)
3. Im Code immer über `ask()` aus `src/lib/ai.ts` – nie das SDK direkt:

```ts
import { ask } from "@/lib/ai";
const { text } = await ask({ system: "Du bist …", prompt: "Was steht auf dem Foto?", image, json: true });
```

- **Modelle:** `gemma-4-26b-a4b-it` (Standard, schnell) oder `gemma-4-31b-it` (stärker) über `GEMINI_MODEL`
- **Anbieter wechseln:** `AI_PROVIDER=gemini | digitalocean | ollama` in `.env.local`, kein Code ändern
- **Prompts** stehen gesammelt in `src/lib/prompts.ts`
- Ohne Key: `MOCK=1` liefert Beispielantworten, damit das Frontend trotzdem gebaut werden kann

## Bug-Loop einrichten

Nur **eine Person** (Bereich B) startet ihn, sonst gibt es doppelte Einträge. In Claude Code im Repo-Ordner:

```text
/loop 30m /bugcheck
```

- Alle 30 Min.: Lint, Typecheck, Build → neue Bugs in `BUGS.md`, offene P0/P1 als Aufgabe in `PROMPT.md`
- Ab 15:30 enger: `/loop 15m /bugcheck`
- Einmalig von Hand: `/bugcheck`
- Aufgaben abarbeiten: `/next-task A` (bzw. B, C, D) · neue Aufgabe anlegen: `/new-task <text>`
- Der Loop läuft, solange diese Claude-Code-Session offen ist

## Project structure

| Path | What |
|------|------|
| `src/lib/types.ts` | Shared contract between all parts |
| `src/lib/ai.ts` | One `ask()` function for Gemini API / DigitalOcean / Ollama |
| `src/lib/prompts.ts` | All prompts |
| `src/app/api/analyze` | Photo → structured analysis |
| `src/app/api/act` | Analysis → next step (draft, explanation, deadline) |
| `src/app/api/speak` | Text → speech (ElevenLabs, browser fallback) |
| `src/features/*` | UI per part |

## Team

**Für das Team (start here):**

- 📄 **Team-Briefing (1 Seite, für alle):** [docs/briefing/Team-Briefing.pdf](docs/briefing/Team-Briefing.pdf)
- 🤖 **Mit Claude arbeiten:** [CLAUDE.md](CLAUDE.md) (Routinen, Modellwahl) · [BUGS.md](BUGS.md) · [PROMPT.md](PROMPT.md) · [SKILLS.md](SKILLS.md)
- 🔌 **Plugins (einmal pro Rechner installieren):** [PLUGINS.md](PLUGINS.md)
- ✅ **Aufgaben (Leo, Hannes, Emil, Lenny):** [AUFGABEN.md](AUFGABEN.md)
- 🧭 Rollen & Bereiche: [docs/ROLLEN.md](docs/ROLLEN.md) · Ablauf: [docs/ABLAUF.md](docs/ABLAUF.md)

**Team**

| Name | Bereich (A–D) | Zusatzrolle | GitHub |
|------|:-------------:|-------------|--------|
| Leo | | | |
| Hannes | | | |
| Emil | | | |
| Lenny | | | |

Team docs (German): [Rollen](docs/ROLLEN.md) · [Ablauf](docs/ABLAUF.md) · [Git-Workflow](docs/GIT-WORKFLOW.md) · [Scope](docs/scope.md) · [Schnittstellen](docs/interfaces.md) · [Pitch](docs/pitch.md) · [Playbook](docs/playbook.md) · [Entscheidungen](docs/decisions.md)

## License

[Apache 2.0](LICENSE)
