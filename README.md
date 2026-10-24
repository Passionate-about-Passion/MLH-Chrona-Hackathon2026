# Hacktober26

> **One sentence: what we solve, for whom.** _(fill in at 11:30)_

Built in one day at **Hacktoberfest Hack Day Mannheim x Q-Summit** (24 Oct 2026) with **Gemma 4**, Google's open-weight model.

## How it works

```
Photo / note ──► Capture ──► Understand (Gemma 4) ──► Act (Gemma 4 + Google Search) ──► Speak (ElevenLabs)
```

- **Open-weight AI at the core:** every step runs on Gemma 4 (`gemma-4-26b-a4b-it` / `gemma-4-31b-it`).
- **Runs where you want it:** Gemini API, DigitalOcean Inference, or fully local via Ollama (Gemma 4 E4B) so sensitive data never leaves the device.
- **Multimodal:** understands photos of real-world documents, not just text.

## Setup

Installiert alle Claude-Code-Plugins und Skills des Teams mit einem Befehl (mehrfach ausführbar):

```bash
bash setup.sh
```

Windows: in **Git Bash** oder **WSL** ausführen. Vor dem Merge auf `main`: `bash setup.sh --local`. Danach Claude Code neu starten.
Einzeln geht auch: `/plugin install hacktober26-team --marketplace Passionate-about-Passion/Hacktober26`

## Quick start

```bash
npm install
cp .env.example .env.local   # MOCK=1 works without any keys
npm run dev                  # http://localhost:3000
npm run test:gemma           # smoke-test every configured Gemma backend
```

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

**Bereiche** – jeder baut seinen Bereich vom Backend bis zum Frontend (Details: [docs/ROLLEN.md](docs/ROLLEN.md)):

| Bereich | Baut | Zusatzrolle |
|:-------:|------|-------------|
| **A** | Erfassen – Foto/Kamera, Upload | Pitch & Teamlead |
| **B** | Verstehen – Gemma-Analyse, Ergebnis-Karte | Integration & Deployment |
| **C** | Handeln – Aktionen, Antwort-Entwurf | Demo-Sicherheit |
| **D** | Sprechen & Lokal – Vorlesen, lokaler Modus | Design & Persona |

Team docs (German): [Rollen](docs/ROLLEN.md) · [Ablauf](docs/ABLAUF.md) · [Git-Workflow](docs/GIT-WORKFLOW.md) · [Scope](docs/scope.md) · [Schnittstellen](docs/interfaces.md) · [Pitch](docs/pitch.md) · [Playbook](docs/playbook.md) · [Entscheidungen](docs/decisions.md)

## License

[Apache 2.0](LICENSE)
