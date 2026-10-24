# Entscheidungen (nur anhängen, nie löschen)

Format: `- JJJJ-MM-TT HH:MM | Entscheidung | Grund | von wem`

- 2026-10-23 20:00 | Teamgröße 4, Rollen als vertikale Bereiche (A Erfassen, B Verstehen, C Handeln, D Sprechen) mit je einer Zusatzrolle | Jeder baut Backend bis Frontend, weniger Wartezeit zwischen Leuten | Team
- 2026-10-23 20:00 | Stack: Next.js 15 + TypeScript + Tailwind 4 | Guidebook-Empfehlung, schnell deploybar | Team
- 2026-10-23 20:00 | KI: Gemma 4 über eine `ask()`-Funktion mit drei Providern (Gemini API, DigitalOcean Inference, Ollama lokal) | Deckt beide Challenges ab (Gemma 4 + Open-Source AI) und erlaubt Wechsel ohne Code-Änderung | Team
- 2026-10-23 20:00 | Standardmodell `gemma-4-26b-a4b-it` | Von Google als Startpunkt empfohlen, geringere Ressourcen | Team
- 2026-10-23 20:00 | Mock-Modus (`MOCK=1`) als Standard bis Keys da sind | Keys/Tokens kommen erst Samstag früh | Team
- 2026-10-23 20:00 | Lizenz Apache 2.0 | Gleiche Lizenz wie Gemma 4, Open-Source-Challenge | Team
- 2026-10-23 20:00 | System-Schriften statt Google Fonts | Build darf nicht am WLAN vor Ort scheitern | Team
- 2026-10-23 21:00 | Bug-Routine alle 30 Min. (`/loop 30m /bugcheck`), nur Bereich B startet sie; Bugs in `BUGS.md`, Aufgaben als Prompts in `PROMPT.md` | Fehler früh finden, keine doppelten Einträge, Aufgaben übergabefertig | Team
- 2026-10-23 21:00 | Abgestufte Modelle: Opus schwer, Sonnet mittel, Haiku einfach – feste Subagents in `.claude/agents/` | Schneller und günstiger, Opus nur wo nötig | Team
- 2026-10-23 21:00 | Projekt-Skills in `.claude/skills/` (frontend-design, modern-web-guidance, 4× superpowers); brainstorming bewusst weggelassen | Gleiche Arbeitsweise für alle; brainstorming zu langsam für einen Tag | Team
- 2026-10-24 | `setup.sh` + Team-Marketplace (`.claude-plugin/marketplace.json`, Plugin `hacktober26-team` mit modern-web-guidance) + `.claude/settings.json` (extraKnownMarketplaces, enabledPlugins) | Jeder installiert Plugins und Skills mit einem Befehl; lose Skills, die schon in Plugins stecken, werden nicht doppelt kopiert | Team
