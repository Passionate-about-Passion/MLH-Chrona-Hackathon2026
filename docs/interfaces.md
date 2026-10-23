# Schnittstellen zwischen den Teilen

Um 11:30 an die Idee anpassen, bevor parallel gebaut wird. Änderungen nur nach Absprache.
Der Code-Vertrag ist `src/lib/types.ts` – diese Datei und `types.ts` immer gemeinsam ändern.

## Datenfluss

```
A Erfassen ──(Foto + Notiz)──► B /api/analyze ──(Analysis)──► C /api/act ──(ActResult)──► D /api/speak ──► Audio
```

## Datenmodell

```ts
Action    { id: string; label: string; type: string }
Analysis  { title: string; summary: string; keyPoints: string[]; deadlines: string[]; actions: Action[]; language: string }
ActResult { actionId: string; text: string; sources?: { title: string; url: string }[] }
Meta      { provider: string; model: string; ms: number; mock?: boolean }
```

## API-Endpunkte

| Methode | Pfad | Eingabe | Ausgabe | Besitzer |
|---|---|---|---|---|
| POST | `/api/analyze` | multipart: `image` (File, opt.), `note` (opt.), `provider` (opt.) | `{ analysis: Analysis, meta: Meta }` | B |
| POST | `/api/act` | JSON: `{ analysis, action, outputLanguage?, provider? }` | `{ result: ActResult, meta: Meta }` | C |
| POST | `/api/speak` | JSON: `{ text }` | `audio/mpeg` · 501 ohne Key → Browser-Fallback | D |

Fehler immer als `{ error: string }` mit passendem HTTP-Status.

## Externe Dienste / APIs

| Dienst | Wofür | Variable(n) | Sponsor |
|---|---|---|---|
| Gemini API | Gemma 4 gehostet (`gemma-4-26b-a4b-it`, `gemma-4-31b-it`), Bilder, Google-Search-Grounding | `GEMINI_API_KEY`, `GEMINI_MODEL` | Google |
| DigitalOcean Inference | Gemma 4 über OpenAI-kompatiblen Endpunkt `https://inference.do-ai.run/v1` | `DO_API_KEY`, `DO_MODEL` | DigitalOcean |
| Ollama (lokal) | Gemma 4 E4B auf dem Laptop – „Daten verlassen das Gerät nicht" | `OLLAMA_MODEL` | – |
| ElevenLabs | Text-to-Speech | `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` | Partner vor Ort |

Hinweis: DigitalOcean Inference bietet laut Doku aktuell **keine EU-Datenresidenz**. Datenschutz-Argument daher über den lokalen Modus führen, nicht über DO.
