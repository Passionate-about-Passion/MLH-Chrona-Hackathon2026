# Ablauf – Sa, 24.10.2026 · MAFINEX Mannheim

## Heute Abend (alle)

- [ ] Repo klonen, `npm install`, `cp .env.example .env.local`, `npm run dev` läuft
- [ ] Eigenes Briefing-Sheet in `docs/briefing/` lesen und den eigenen Ordner in `src/features/` ansehen
- [ ] Aufgaben-Board öffnen: https://claude.ai/artifact/GZ59hiJNRHBN5n5o2AyCmt
- [ ] Person 1: Deck-Vorlage anlegen (Persona-Story wie Janus/Minerva)
- [ ] Person 4: grobe Farb- und Stilidee
- [ ] Laptops laden, Ladekabel und Mehrfachstecker einpacken

## Morgen früh: Setup (sobald Keys/Tokens da sind)

Person 2 macht das, die anderen helfen bei Bedarf:

1. Keys in `.env.local` eintragen (Vorlage: `.env.example`)
   - `GEMINI_API_KEY` (aistudio.google.com/apikey)
   - `DO_API_KEY` + `DO_MODEL` (exakte Gemma-4-ID aus dem DigitalOcean Model Catalog)
   - `ELEVENLABS_API_KEY` (optional)
2. `npm run test:gemma` – muss bei Gemini ✅ zeigen
3. Mit echtem Foto testen: `npm run test:gemma -- gemini pfad/zum/foto.jpg`
4. Keys **nicht** in den Chat oder ins Repo – nur per Direktnachricht weitergeben
5. Erst wenn alles grün ist: `MOCK=0`

## Der Tag

| Zeit | Programm | Team |
|------|----------|------|
| 10:00 | Check-in | Früh da sein, ruhigen Platz sichern |
| 10:30 | Welcome | P1 fragt Orga/Sponsoren: Jury, Pitchlänge, Kriterien, Preise · P2 macht Key-Setup |
| 11:00 | **Hacking startet** | Ideenfindung: 5 Min. einzeln, 10 Min. zusammenführen, Ein-Satz-Pitch |
| 11:30 | Stand-up | `types.ts` anpassen, Idee den Sponsoren zeigen → Feedback |
| 11:30–13:00 | Bauen | Jeder seinen Bereich, Mock-Modus |
| 13:00 | Lunch + Stand-up | Erster Merge: App läuft einmal komplett |
| 14:00 | Stand-up | **Feature-Stopp** |
| 15:00 | Stand-up | Alles in `main`, echte KI, Deployment steht |
| 15:30 | **Demo steht** | Tag `demo`, Demo 5–10× durchspielen, Backup-Video, Pitch üben |
| 16:30 | Abgabe vorbereiten | README, Repo öffentlich, MLH-Submission |
| 16:45 | **Abgabe** | |
| 17:00 | Präsentationen | |
| 18:00 | Judging | |
| 18:30 | Preisverleihung | |
