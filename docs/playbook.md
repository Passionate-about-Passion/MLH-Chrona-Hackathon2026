# Playbook: How to win a Hackathon (verdichtet aus dem Guidebook)

Kernidee: Ein Hackathon ist ein Business Case, kein Erfinderwettbewerb. Wer sein Produkt nicht verkaufen kann, hat effektiv keins.

## Wie gewonnen wird
- Die Jury entscheidet, und zwar zuerst emotional ("Das Team wollen wir gewinnen sehen"), danach suchen sie logische Argumente.
- Emotional: freundlich, ehrlich interessiert am Problem und an der Jury, präsent. Genau eine Person (max. zwei) pflegt den Kontakt zur Jury.
- Logisch: Beste Lösung, funktionierender MVP, klarer Business Case.
- Kriterien sind zweitrangig, Präferenzen der Jury zählen.

## Jury-Typen
| Typ | Worauf achten |
|---|---|
| API-Sponsor | Dienst kreativ einbinden, wenig genutzte Funktionen nutzen |
| CTO | Funktionierender, deployter MVP; Fragen zu Skalierung und Edge Cases; Architektur wichtiger als Code; keine simple App, die viel Kundenvalidierung braucht |
| Investor | Marktgröße (TAM/SAM/SOM), Kennzahlen, Skalierbarkeit |
| Business Dev | Sofort verständliche Zielgruppe, Akquise-Roadmap; vermeiden: Konzernpartnerschaften, Verkauf an Kleinbetriebe, Gratisprodukte |

## Challenge-Wahl
- Bewerten nach: nötiges Wissen, Ressourcen, Skills, Impact.
- Gut: konkretes Problem, echter Business Case ("morgen Umsatz machbar").
- Schlecht: zu eng (alle bauen dasselbe), zu weit (Zufall), zu futuristisch.

## Ideation (erste 1–2 h)
1. Diverge (einzeln, 5–10 min Timer): Probleme sammeln, dann Lösungen. Nicht bewerten.
2. Converge (Team, ein Moderator): Ideen in einen Flowchart des bestehenden Prozesses einordnen, diskutieren, eingrenzen.
3. Feedback beim Challenge-Geber holen, bis er nichts mehr hinzufügt. Was er nicht wertschätzt, fliegt raus. Was er wertschätzt, ist der Pitch.
4. Optional: echte Kunden anrufen (Apollo, LinkedIn), Fotos und Notizen für den Pitch. Zeitaufwändig, nur wenn es sich lohnt.
5. Check: Lösung in einem Satz? Feature-Anzahl festgelegt? Wer zahlt und warum? Jeder im Team versteht dasselbe Produkt?
- Einfache Idee kreativ umgesetzt schlägt technisch beeindruckend, aber irrelevant.
- Entdeckungsfragen: Wer sind die Stakeholder? Größte Probleme? Was wurde versucht, was funktionierte, was nicht? Wer treibt Fortschritt, wer blockiert?

## Bauen
- Rückwärts vom Pitch: nur bauen, was gezeigt wird. Nicht in der Demo = Wert null.
- 1–2 Kernfeatures. Keine Features, die niemand verlangt hat. Keine komplexen Integrationen.
- Scope Creep vermeiden. Pitch von Anfang an parallel entwickeln, eine Person ist dafür zuständig (idealerweise der Pitcher) und gleicht Gebautes mit Gepitchtem ab.
- Keine Informationssilos: alle 3 h kurzes Meeting. Stuck? Sofort melden, nicht still blockieren.
- Repo: stabiler Build, Pre-Commit-Hooks (husky, eslint, jscpd), klare Zuständigkeit pro Aufgabe.
- Pitcher schläft am meisten. Essen, Trinken, Pausen für alle.
- KI für Slides nur als Inspiration. Unveränderter KI-Output wirkt unauthentisch.

## Letzte Stunden
- Scope früh einfrieren. Ziel: lauffähige Demo 2–3 h vor Deadline.
- Alles in eine Version zusammenführen, keine kaputten Merges.
- Leader darf alle stoppen (Force-Stop). 10–15 min Puffer, dann stabile Version ziehen.
- Live-Demo nur, wenn stabil: 5–10 mal testen, Reset-Skript (Run, Reset, Run). Sonst Video. Schlimmster Fall: reden ohne Demo.
- Checkliste direkt vor dem Pitch: App läuft, Daten stimmen, Demo-Zustand sauber.

## Pitch
- Hook in den ersten Sekunden. Persona-Storytelling ("Das ist James …") statt Feature-Walkthrough.
- Ein Teammitglied spielt die Persona, ganzes Team einbinden, ohne Qualität zu opfern.
- Differenzierung: echte Kundengespräche, Fotos, Validierung.
- Business Case: Wertversprechen, Zielnutzer, Go-to-Market, Preis. Bei kurzer Zeit gilt Lösung vor Business Case.
- Mindestens 5x üben, im echten Setup. Zeitregel bei Organisatoren erfragen.

## Danach
Feedback der Jury notieren, nach ein paar Tagen reflektieren, öffentlich teilen (LinkedIn), Netzwerk nutzen.

## Tools (Auswahl aus dem Guidebook)
- Code: Cursor, Claude Code, Antigravity, Codex
- Folien: pitch.com, PowerPoint, Figma
- UI/UX: Stitch, Gemini, Figma
- Brainstorming: Miro
- Logos/Bilder: Nano Banana Pro 2
- Pitch-Video: Hyperreel, Remotion
