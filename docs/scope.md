# Scope (Single Source of Truth für "was bauen wir")

## Lösung in einem Satz
Ein KI-Stundenplan-Assistent, der Vorlesungs-, Übungs- und Tutoriumstermine mit privaten Terminen und Hobbys zu einem konfliktfreien Plan kombiniert und bei spontanen Änderungen per Sprache neu plant. (Gesamtkonzept: `docs/konzept.md`)

## Problem und Persona
- Problem: Studierende müssen aus vielen Parallelterminen (Vorlesung, Übung, Tutorium) von Hand einen Plan bauen, der zu Hobbys und privaten Terminen passt, und bei jeder Änderung alles neu sortieren.
- Persona (Name, Beruf, Schmerzpunkt): TODO (Studierende; Name und konkreter Schmerzpunkt für den Pitch noch festlegen)
- Wer zahlt und warum: TODO

## Kernfeatures (maximal 2)
1. Stundenplan-Optimierung: aus allen Terminoptionen ein konfliktfreier Plan, Kursgewichte entscheiden bei Konflikten.
2. Spontane Änderung per Sprache („Donnerstag 14–16 Uhr habe ich einen Termin"): Woche neu legen, Ausweichtermine vorschlagen.

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
1. TODO (Persona stellt Problem vor)
2. TODO (Foto aufnehmen → Gemma versteht es)
3. TODO (Aktion auslösen → Ergebnis, ggf. vorlesen)
4. TODO (optional: Umschalten auf „Lokal" → gleiches Ergebnis, nichts verlässt das Gerät)
