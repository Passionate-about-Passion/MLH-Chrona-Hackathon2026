# [Projektname] – KI-Stundenplan-Assistent

Kalender-App für Studierende, die Vorlesungs-, Übungs- und Tutoriumstermine
automatisch mit privaten Terminen und Hobbys zu einem konfliktfreien Stundenplan
kombiniert und bei spontanen Änderungen per Sprache neu plant.

## Idee
Zu Semesterbeginn werden alle Haupt- und Paralleltermine (Vorlesung, Übung,
Tutorium) einmal importiert und in einer Datenbank gespeichert.

## Use Cases
1. **Stundenplan-Optimierung:** Aus allen Terminoptionen wird ein effizienter
   Plan erstellt, der mit Hobbys und privaten Terminen vereinbar ist.
   Kurse können gewichtet werden (Priorität), damit wichtige Veranstaltungen
   bei Konflikten bevorzugt werden.
2. **Spontane Änderung per Sprache:** Nutzer:in sagt z. B. "Donnerstag 14–16 Uhr
   habe ich einen festen Termin". Die App legt die Woche neu und schlägt
   Ausweichtermine für verpasste Veranstaltungen vor, orientiert an den
   Kursgewichten.

## Architektur
- **Speech-to-Text:** IBM Granite Speech (open source)
- **Sprachverständnis:** Gemma 4 (open weights) – wandelt Sprache/Text in
  strukturierte Constraints und Kursgewichte (JSON) um
- **Planung:** Constraint-Solver (OR-Tools CP-SAT) – garantiert konfliktfreie Pläne;
  Kursgewichte fließen in die Zielfunktion ein
- **Text-to-Speech:** ElevenLabs (proprietärer Cloud-Dienst, kein Open Source;
  optional ersetzbar durch ein Open-Source-TTS)
- **Daten:** Termin-Import (Scraper/Export) → Datenbank (Kurs → Gruppe → Einzeltermin)
- Kein Training der Modelle nötig: Termine und Gewichte liegen als Daten vor,
  nicht in den Modellgewichten.

## Status
Konzeptphase.
