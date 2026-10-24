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
- 2026-10-24 12:15 | Projektidee: KI-Stundenplan-Assistent (Konzept in `docs/konzept.md`), zwei Kernfeatures: Stundenplan-Optimierung und Umplanung per Sprache | Passt zu Persona Studierende, zeigt Gemma 4 sichtbar im Kern | Team
- 2026-10-24 12:15 | Architektur: Granite Speech (STT) → Gemma 4 (Sprache zu JSON-Constraints und Kursgewichten) → OR-Tools CP-SAT (Planung) → ElevenLabs (TTS, optional) | Solver garantiert konfliktfreie Pläne, Gemma erzeugt nur Constraints; kein Modelltraining nötig | Team
- 2026-10-24 12:15 | OFFEN: Konzept sieht Termin-Datenbank und Import (Scraper/Export) vor, `docs/scope.md` schließt Datenbank/Verlauf aus; für die Demo klären (z. B. feste Beispieltermine als JSON statt Datenbank). Außerdem: Photo-Pipeline (A Erfassen) und `types.ts` passen noch nicht zum neuen Konzept | Widerspruch zwischen Konzept und Starter-Vorlage, vor Scope-Freeze 14:00 entscheiden | Team
- 2026-10-24 | `setup.sh` + Team-Marketplace (`.claude-plugin/marketplace.json`, Plugin `hacktober26-team` mit modern-web-guidance) + `.claude/settings.json` (extraKnownMarketplaces, enabledPlugins) | Jeder installiert Plugins und Skills mit einem Befehl; lose Skills, die schon in Plugins stecken, werden nicht doppelt kopiert | Team
- 2026-10-24 | Planer als TypeScript-Backtracking statt OR-Tools CP-SAT | Kein Python-Dienst neben Next.js; ~5 Kurse × 3 Gruppen sind rund 250 Kombinationen, die eine Schleife in Millisekunden prüft | Lenny
- 2026-10-24 | Spracherkennung im Browser bzw. iPhone-Diktat statt IBM Granite Speech | Granite braucht Python und einen Modell-Download; die Browser-API reicht für die Demo, Granite bleibt als Ausbaustufe im Pitch | Lenny
- 2026-10-24 | Kursdaten in einer JSON-Datei (`src/data/courses.json`) statt Datenbank | Scope ist zustandslos (Reset = Seite neu laden), die Demo-Daten pflegen wir von Hand | Lenny
- 2026-10-24 | Gemma 4 E4B lokal über Ollama als Hauptprovider | Daten verlassen das Gerät nicht; DigitalOcean Inference hat keine EU-Datenresidenz | Lenny
- 2026-10-24 | Gewichtung der Module durch Gemma: Priority 1–3 mit Begründung, aus Kursdaten und der Aussage der Nutzerin („Mathe ist mir super wichtig"); ohne Aussage gilt Standard (Pflicht + Prüfung 3, Pflicht 2, Wahl 1) | Gemma übersetzt die Aussage in Gewichte, die Standardregel macht das Ergebnis auch ohne Aussage nachvollziehbar | Lenny
- 2026-10-24 | Antwort auf „Welche Termine habe ich?" baut der Code aus dem Plan, nicht Gemma | Gemma könnte Termine erfinden; der Code liest nur, was im Plan steht | Lenny
- 2026-10-24 | Termine als `hard: true` (fester Termin, der Plan muss ausweichen) oder `hard: false` (Wunsch wie „Dienstag frei", Abzug von 0,5 Punkten pro Termin) | Feste Termine werden nie überschrieben, Wünsche nur, wenn es ohne Verlust eines wichtigen Moduls geht | Lenny
