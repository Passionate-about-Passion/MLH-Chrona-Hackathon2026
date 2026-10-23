# Plugins für Claude Code

Plugins installiert jeder **einmal auf seinem eigenen Rechner** (sie liegen nicht im Repo). Befehle mit `/plugin …` tippt ihr **in Claude Code** ein, Befehle mit `npx …` im **Terminal**.
Nach dem Installieren Claude Code neu starten und mit `/plugin list` prüfen.

> **Weniger ist mehr.** Jedes Plugin lädt Beschreibungen in den Kontext und kann Claude ausbremsen oder sich mit anderen überschneiden. Für morgen: **Pflicht-Set installieren, Rest nur bei Bedarf.** Nicht mehrere „Komplett-Pakete“ (ECC, Agentic Awesome Skills, superpowers) gleichzeitig.

## Pflicht-Set für morgen (alle 4)

Alles aus dem offiziellen Anthropic-Marktplatz `claude-plugins-official`:

```text
/plugin install superpowers@claude-plugins-official
/plugin install context7@claude-plugins-official
/plugin install frontend-design@claude-plugins-official
/plugin install typescript-lsp@claude-plugins-official
```

| Plugin | Was es tut | Warum für uns |
|---|---|---|
| **superpowers** (obra) | Skills für Planen, systematisches Debuggen, Verifizieren, parallele Agents | Unsere Routinen (`/bugcheck`, `slice-builder`) bauen darauf auf. Vier davon liegen schon in `.claude/skills/`. |
| **Context7** (Upstash) | Holt versionsgenaue, aktuelle Doku und Code-Beispiele direkt in die Session – verhindert veraltete API-Aufrufe | Gemma 4, `@google/genai`, Next.js 15 sind neu – genau da rät Claude sonst falsch. Beim ersten Aufruf bei Context7 anmelden. |
| **frontend-design** (Anthropic) | Hochwertige, eigenständige UIs statt generischer KI-Layouts | Demo muss gut aussehen. Liegt auch schon als Skill im Repo. |
| **typescript-lsp** (Anthropic, LSP-Pack) | Code-Intelligenz: Go-to-Definition, Referenzen, Typfehler | Unser Stack ist TypeScript. Für andere Sprachen gibt es `pyright-lsp`, `gopls-lsp`, `rust-analyzer-lsp` usw. |

Falls `superpowers@claude-plugins-official` nicht gefunden wird:
```text
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

## Je nach Rolle

| Plugin | Installieren | Was es tut | Für wen |
|---|---|---|---|
| **code-review** | `/plugin install code-review@claude-plugins-official` | Mehrere Agents prüfen PRs, Confidence-Scoring filtert Rauschen | B (Integration) – vor jedem Merge |
| **Playwright** (Microsoft) | `/plugin install playwright@claude-plugins-official` | Echter Browser: Claude klickt die App durch, macht Screenshots, schreibt E2E-Tests | C (Demo-Sicherheit) – Demo-Flow automatisch prüfen |
| **claude-code-setup** | `/plugin install claude-code-setup@claude-plugins-official` | Analysiert das Repo und schlägt passende Hooks, Skills, MCP-Server vor | Einmal heute Abend, eine Person |

## Optional (nur wer es kennt)

| Plugin / Paket | Installieren | Was es tut | Hinweis |
|---|---|---|---|
| **claude-mem** (thedotmack) | Terminal: `npx claude-mem install` · oder in Claude Code: `/plugin marketplace add thedotmack/claude-mem` → `/plugin install claude-mem` | Gedächtnis über Sessions hinweg (komprimierte Zusammenfassungen) | Praktisch, wenn Sessions über den Tag neu gestartet werden |
| **Matt Pococks Skills** | `/plugin install mattpocock-skills@claude-plugins-official` · Alternative: `npx skills@latest add mattpocock/skills` | Skill-Sammlung von Matt Pocock (TypeScript-Fokus) – https://github.com/mattpocock/skills | Beim Installer `setup-matt-pocock-skills` mit auswählen |
| **ECC – Everything Claude Code** (affaan-m) | Terminal: `npx ecc-universal@2.2.3 setup` | Großes „Agent-Harness“: Agents, Skills, Hooks, Commands – https://github.com/affaan-m/ecc | Sehr umfangreich, **nicht** zusammen mit superpowers. Laut README nur einen Installationsweg wählen. |
| **Agentic Awesome Skills** (sickn33, früher „antigravity-awesome-skills“) | Terminal: `npx agentic-awesome-skills --claude` · oder `/plugin marketplace add sickn33/agentic-awesome-skills` → `/plugin install agentic-awesome-skills` | Riesige Skill-Bibliothek (über 2.700 Skills) | Nur gezielt einzelne Skills nehmen, sonst Kontext-Überlastung |
| **task observer** | – | – | Nicht gefunden. Bitte Link ergänzen. |

## Bereits im Repo (nichts zu tun)

`.claude/skills/`: frontend-design, modern-web-guidance, systematic-debugging, verification-before-completion, writing-plans, dispatching-parallel-agents – siehe [SKILLS.md](SKILLS.md).
`.claude/agents/` und `.claude/commands/`: Routinen und Modellstufen – siehe [CLAUDE.md](CLAUDE.md).

## Quellen

- Offizieller Marktplatz: https://github.com/anthropics/claude-plugins-official
- superpowers: https://github.com/obra/superpowers
- Context7: https://github.com/upstash/context7
- claude-mem: https://github.com/thedotmack/claude-mem
- Agentic Awesome Skills: https://github.com/sickn33/antigravity-awesome-skills
- Übersichten: https://www.buildthisnow.com/pt/blog/guide/mechanics/best-claude-code-plugins-2026 · https://fridayaiclub.com/top-10-claude-code-plugins-to-try-in-2026/ · https://www.ayautomate.com/blog/best-claude-code-plugins

Stand: 23.10.2026, Befehle aus den READMEs der Repos.
