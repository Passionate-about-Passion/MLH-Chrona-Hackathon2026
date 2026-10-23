# Rollen – jeder baut einen Bereich vom Backend bis zum Frontend

Jede Person besitzt **einen Bereich (Slice)** komplett: Prompt bzw. API-Route im Backend **und** die UI-Komponente im Frontend.
Dazu kommt **eine Zusatzrolle** fürs Team. Die Schnittstelle zwischen den Bereichen steht in `src/lib/types.ts`.

```
 Foto/Notiz ──► A ERFASSEN ──► B VERSTEHEN ──► C HANDELN ──► D SPRECHEN
               CaptureCard     /api/analyze     /api/act       /api/speak
                               AnalysisView     ActionPanel    SpeakButton
```

| # | Name | Bereich (Backend → Frontend) | Zusatzrolle |
|---|------|------------------------------|-------------|
| 1 | _____ | **A · Erfassen** | Pitch & Teamlead |
| 2 | _____ | **B · Verstehen** | Integration & Deployment |
| 3 | _____ | **C · Handeln** | Demo-Sicherheit |
| 4 | _____ | **D · Sprechen & Lokal** | Design & Persona |

---

## 1 · Erfassen – Pitch & Teamlead

Kleinster Bereich, weil der Pitch die meiste Zeit braucht.

**Backend:** Input-Handling in `src/app/api/analyze/route.ts` (Bildgröße, Formate, ggf. verkleinern), Demo-Bilder in `public/samples/`.
**Frontend:** `src/features/capture/CaptureCard.tsx` – Kamera/Upload, Vorschau, Notizfeld, Lade- und Fehlerzustand.
**Zusatzrolle:**
- Einziger Kontakt zu Jury & Sponsoren (vor 11:00: Jury? Pitchlänge? Kriterien? Preisgeld?)
- Moderiert die Ideenfindung, formuliert den Ein-Satz-Pitch
- Baut das Deck ab 11:30, prüft laufend: passt Gebautes zum Pitch?
- Hat das letzte Wort: ab **14:00 Feature-Stopp**

## 2 · Verstehen – Integration & Deployment

Das Herz: Gemma liest das Foto und liefert strukturierte Daten.

**Backend:** `ANALYZE_SYSTEM` in `src/lib/prompts.ts`, `src/app/api/analyze/route.ts`, `src/lib/ai.ts` (Provider-Wechsel Gemini / DigitalOcean / Ollama). JSON muss **immer** gültig sein.
**Frontend:** `src/features/understand/AnalysisView.tsx` – Ergebnis-Karte, Fristen, Kernpunkte.
**Zusatzrolle:**
- Hält `main` grün (CI), merged PRs, löst Konflikte
- Deployment (Vercel o. ä.) ab 13:00 einmal durchziehen, nicht erst um 16:00
- Trägt morgen früh als Erstes die Keys ein und führt `npm run test:gemma` aus

## 3 · Handeln – Demo-Sicherheit

Aus dem Verstehen wird ein konkreter nächster Schritt.

**Backend:** `ACT_SYSTEM` in `src/lib/prompts.ts`, `src/app/api/act/route.ts` – Aktionen wie Antwort entwerfen, einfach erklären, Frist finden (mit Google-Search-Grounding).
**Frontend:** `src/features/act/ActionPanel.tsx` – Aktions-Buttons, Ergebnis, Kopieren.
**Zusatzrolle:**
- Schreibt das Demo-Drehbuch (welches Foto, welcher Klick, welche Antwort)
- Fährt die Demo ab 15:30 **5–10×** durch, nimmt das **Backup-Video** auf
- Bereitet Abgabe vor: README, Screenshots, Repo öffentlich

## 4 · Sprechen & Lokal – Design & Persona

Der Wow-Effekt: die App spricht, und auf Wunsch läuft alles lokal.

**Backend:** `src/app/api/speak/route.ts` (ElevenLabs), optional lokaler Modus mit Gemma E4B über Ollama (Datenschutz-Argument: nichts verlässt das Gerät).
**Frontend:** `src/features/voice/SpeakButton.tsx` – Vorlesen mit Fallback auf Browser-Sprache; Provider-Schalter im Header.
**Zusatzrolle:**
- Look & Feel der App (Farben, Abstände, Startbildschirm) – **zuerst**, damit alle danach bauen
- Visuals fürs Deck (Workflow-Grafiken im Janus/Minerva-Stil)
- Echte Zahlen zum Problem **mit Quelle** recherchieren
- Spielt im Pitch die Persona („Das ist …“)

---

## Regeln

1. **Vertrag zuerst:** Um 11:30 gemeinsam `src/lib/types.ts` anpassen. Danach nur nach Absprache ändern.
2. **Mock-Modus (`MOCK=1`)** erlaubt allen, ihr Frontend ohne funktionierende KI zu bauen.
3. **Jeder fasst nur seine eigenen Ordner an.** `page.tsx` und `types.ts` gehören allen – kurze Ansage im Chat vorher.
4. **Stand-ups:** 11:30 · 13:00 · 14:00 · 15:00 · 15:30, max. 5 Min. Wer feststeckt, sagt es sofort.
5. **Ab 14:00 keine neuen Features.**
