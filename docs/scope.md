# Scope (Single Source of Truth für "was bauen wir")

## Lösung in einem Satz
TODO (wenn das nicht in einem Satz geht, ist die Idee noch nicht einfach genug)

## Problem und Persona
- Problem: TODO
- Persona (Name, Beruf, Schmerzpunkt): TODO
- Wer zahlt und warum: TODO

## Kernfeatures (maximal 2)
1. Stundenplan per Sprache umlegen – feste Termine und Wünsche wie „Dienstag frei", wichtige Module (von Gemma gewichtet) setzen sich durch
2. „Welche Termine habe ich?" – Antwort wird vorgelesen (ElevenLabs)

## Bewusst nicht gebaut
- Login / Accounts
- Datenbank / Verlauf (App ist zustandslos – „Reset" = Seite neu laden)
- TODO

## Zeitplan (rückwärts von der Deadline)
Eintägiger Hack: Die Guidebook-Werte (Freeze = Deadline − 7 h) passen nicht, daher verkürzt.

- Hacking-Start: 11:00
- Idee + Vertrag (`types.ts`) fix: 11:30
- Erster Komplett-Merge (Mock): 13:00
- **Scope-Freeze: 14:00**
- Echte KI, alles in `main`, Deployment steht: 15:00
- **Lauffähige Demo („Baseline"): 15:30** → `git tag demo`
- Abgabe vorbereiten: 16:30 · **Deadline: 16:45** (10–15 min Puffer)
- Check-in-Meetings: 11:30 · 13:00 · 14:00 · 15:00 · 15:30
- Zuständig für Force-Stop (Leader): TODO (Pitcher)

## Demo-Skript
1. Persona stellt vollen Dienstag vor
2. „Donnerstag 14 bis 16 Uhr habe ich einen Termin" → Statistik-Übung wandert auf Freitag
3. „Ich will dienstags frei haben" → alles außer der Mathe-Vorlesung zieht um, App sagt warum
4. „Welche Termine habe ich am Mittwoch?" → wird vorgelesen
5. optional: alles lokal (Gemma über Ollama)
