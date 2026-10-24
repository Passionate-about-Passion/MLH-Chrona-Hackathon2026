# Feature-Liste – KI-Stundenplan-Assistent

Stand: 24.10.2026, 15:45 · Branch `main`

## Kern: Stundenplan per Sprache, mit Gemma 4

| Feature | Was passiert | Technik |
|---|---|---|
| **Sprache → Plan** | „Montag 13:45 bis 15:15 habe ich einen Arzttermin“ → nur die betroffene Übung wandert in eine freie Gruppe (z. B. Di 10:15), alles andere bleibt | Gemma 4 versteht Satz → Sperrzeiten, Gewichte, Rückfragen; TS-Planer rechnet |
| **Audio direkt an Gemma** | Mikro-Knopf nimmt auf, Gemma transkribiert und versteht in einem Schritt (< 1 s) | Gemma 4 E4B lokal über Ollama (`input_audio`); Browser-Spracherkennung als Fallback |
| **Lokal oder gehostet** | Gemma läuft offline auf dem Laptop („Daten verlassen das Gerät nicht“) oder gehostet | Umschaltbar: Ollama, Gemini API (`gemma-4-26b-a4b-it`), OpenRouter |
| **Harte Termine vs. Wünsche** | „Fester Termin“ = Sperrzeit, „dienstags frei“ = Wunsch; bleibt ein Pflichttermin trotzdem, sagt die App warum | Gemma unterscheidet `hard`/Wunsch, Planer erklärt Konflikte |
| **Gewichte mit Begründung** | Pflichtmodul mit Prüfung zählt mehr als Wahlfach; Gewichte bleiben über mehrere Sätze erhalten | Gewichte 1–3 von Gemma, im Planer als Priorität |
| **Rückfragen** | Unklare Angaben („ab 14 Uhr“) → Gemma fragt nach, Antwort per Knopf | `questions` in der Gemma-Antwort |
| **Fragen statt Umplanen** | „Welche Termine habe ich am Mittwoch?“ → Antwort wird vorgelesen, nichts wird verschoben | Intent `query`, Antworttext ohne KI aus dem Plan |
| **Minimal-Änderung** | Neuplanung ändert nur, was nötig ist; geänderte Termine werden hervorgehoben | Planer mit aktuellem Plan als Ausgangspunkt |
| **Schneller Planer** | Echte BWL-Daten (70 Gruppen) in < 0,1 s statt 27–70 s | Branch-and-Bound mit Schranke, 2-s-Notbremse |
| **Vorlesen** | Änderungen und Antworten werden gesprochen | ElevenLabs (Team-Stimme), sonst Browser-Stimme |

## Kalender

| Feature | Was passiert |
|---|---|
| **Google-Kalender-Sync** | Jeder neue Plan landet sofort im eigenen Kalender „Stundenplan“ – wöchentliche Serien bis Semesterende, nur geänderte Termine werden neu geschrieben |
| **Privater Kalender wird gelesen** | Private Termine aus dem Google-Hauptkalender (Zahnarzt, Job …) werden automatisch zu Sperrzeiten; Uni-Termine erkennt die App am Namen und überspringt sie |
| **Einmal anmelden** | OAuth mit Offline-Zugriff, Token bleibt auf dem Server; abschaltbar für die Demo |
| **.ics-Export** | Kompletten Plan als Kalenderdatei herunterladen (Lernplan-Tab) |

## Studiengänge

| Feature | Was passiert |
|---|---|
| **Startbildschirm** | Studiengang + Semester einmal wählen, danach direkt in die App (`/?reset` zeigt die Auswahl wieder) |
| **Echte Daten** | BWL 1. Semester aus dem Vorlesungsverzeichnis der Uni Mannheim (Konverter `scripts/convert-bwl.mjs`); WiFo 1. Semester aus einem echten Studi-Kalender; VWL und weitere Semester mit Beispielterminen |
| **Kursauswahl** | Planen nur für ein Semester oder ausgewählte Kurse (`program`, `term`, `courseIds`) |

## Campus-Karte

| Feature | Was passiert |
|---|---|
| **Vollbild-Lageplan** | Tippen auf einen Termin → Karte fliegt animiert zum Gebäude, Pin pulsiert |
| **Wie eine Karten-App** | Wischen mit Schwung, Pinch- und Doppeltipp-Zoom, Ziel immer mittig, „Zum Raum“ |
| **Formgetreu** | Grundriss nach dem offiziellen Uni-Plan: Campus West (A3, A5, B6), Schloss mit allen Flügeln und Höfen, L7, L9 |
| **Bibliotheken live** | Auslastung der Bibliotheken A3, A5, Ehrenhof, Schneckenhof direkt von der Uni-Bib-Seite; Antippen zeigt „41 % belegt von 675 Plätzen“ mit Ampelfarbe |
| **Mensa-Speiseplan** | Antippen der Mensa zeigt den echten Tagesplan mit Preisen (Studierendenwerk Mannheim) |

## App & Bedienung

- Glas-Look im Apple-Stil, Wochenstreifen, Tages- und Monatsansicht, für das Handy gebaut
- Läuft auf dem iPhone über HTTPS im WLAN (`npm run phone`, eigenes Zertifikat) – Mikro funktioniert
- Robust: fällt Google, Bib-Seite oder Mensa aus, plant und zeigt die App ohne diese Daten weiter
- Selbsttests für Planer, Kalender, Vorlesetext, Audio, Karte und Live-Daten (`npm test`, Teil von `scripts/check.sh`)

## Für den Pitch

- **Best Use of Gemma 4:** Gemma hört (Audio), versteht (Sperrzeit vs. Wunsch, Gewichte, Rückfragen) und steuert den Planer – lokal auf dem Laptop.
- **Best Open-Source AI Project:** komplett offen, keine Cloud nötig, eigene Daten bleiben lokal.
