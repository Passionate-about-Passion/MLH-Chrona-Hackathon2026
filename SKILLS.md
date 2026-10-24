# Skills im Repo

Lose Skills liegen in `.claude/skills/` und laden automatisch, wenn das Repo geöffnet ist. `modern-web-guidance` steckt im Team-Plugin `plugins/hacktober26-team/`. `bash setup.sh` installiert alles auf einmal.
Claude nutzt sie von selbst, wenn die Beschreibung passt. Ihr könnt sie auch direkt anfordern: „nutze den Skill systematic-debugging“.

| Skill | Wofür bei uns | Wer vor allem | Quelle / Lizenz |
|---|---|---|---|
| `frontend-design` | UI, die nicht nach Vorlage aussieht: Farben, Typo, Layout | D, A | Anthropic · Apache 2.0 |
| `modern-web-guidance` (Plugin `hacktober26-team`) | Aktuelle Web-APIs & CSS (Kamera-Input, Dialoge, Formulare, Performance) | A, D | Google Chrome · Apache 2.0 |
| `systematic-debugging` | Bugs an der Ursache fixen statt raten – Pflicht für `bug-hunter` | alle | superpowers (obra) · MIT |
| `verification-before-completion` | Erst Beweis (Check grün), dann „fertig“ sagen | alle | superpowers · MIT |
| `writing-plans` | Größere Aufgaben (> 2 Dateien) erst planen | B, Opus-Aufgaben | superpowers · MIT |
| `dispatching-parallel-agents` | Mehrere unabhängige Aufgaben parallel an Subagents geben | B | superpowers · MIT |

**Hinweise**

- `writing-plans` verweist auf weitere superpowers-Skills (`executing-plans`, `subagent-driven-development`, `using-git-worktrees`), die hier bewusst fehlen. Bei uns gilt: Pläne kurz halten und als Aufgaben in `PROMPT.md` ablegen, nicht unter `docs/superpowers/`.
- `brainstorming` aus superpowers ist absichtlich **nicht** dabei: Es startet vor jeder kreativen Aufgabe einen langen Dialog – zu langsam für 5,5 h Bauzeit. Ideen macht ihr um 11:00 im Team.
- Mehr superpowers-Skills: https://github.com/obra/superpowers (MIT). Lizenztexte liegen jeweils als `LICENSE.txt` im Skill-Ordner.

## Subagents & Befehle (in `.claude/`)

| Name | Art | Modell | Aufgabe |
|---|---|---|---|
| `check-runner` | Subagent | haiku | Lint, Typecheck, Build ausführen, kurz berichten |
| `task-writer` | Subagent | haiku | Bugs und Ideen als Prompts in `PROMPT.md` schreiben |
| `bug-hunter` | Subagent | sonnet | Änderungen prüfen, Bugs in `BUGS.md` dokumentieren |
| `slice-builder` | Subagent | sonnet | Eine Aufgabe in einem Bereich umsetzen |
| `/bugcheck` | Befehl | sonnet | Die 30-Minuten-Routine |
| `/next-task <A-D>` | Befehl | je nach Aufgabe | Nächste Aufgabe holen und umsetzen |
| `/new-task <text>` | Befehl | haiku | Neue Aufgabe in `PROMPT.md` anlegen |
