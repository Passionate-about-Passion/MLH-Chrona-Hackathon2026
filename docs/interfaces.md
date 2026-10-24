# Schnittstellen zwischen den Teilen

Um 11:30 an die Idee anpassen, bevor parallel gebaut wird. Änderungen nur nach Absprache.
Der Code-Vertrag ist `src/lib/types.ts` (Abschnitt „Stundenplan") – diese Datei und `types.ts` immer gemeinsam ändern. Hintergrund: `docs/backend.md`.

## Datenfluss

```
Sprache (Browser / iPhone-Diktat) ──► Text ──► POST /api/analyze (Gemma 4) ──► Understanding
    ──► POST /api/act (Planer, TypeScript) ──► Plan ──► Wochenansicht

Frage „Welche Termine habe ich?" ──► Antworttext aus Code ──► POST /api/speak (ElevenLabs)
```

Gemma formuliert nur das Verständnis (Constraints, Gewichte, Rückfragen). Der Planer rechnet im Code, und der Antworttext auf Terminfragen entsteht ebenfalls im Code.

## Datenmodell

```ts
Day        "Mo" | "Di" | "Mi" | "Do" | "Fr" | "Sa" | "So"
GroupKind  "Vorlesung" | "Übung" | "Tutorium"
Session    { day: Day; start: string; end: string; room?: string }          // "HH:MM"
Group      { id: string; kind: GroupKind; sessions: Session[] }
Course     { id: string; name: string; required: boolean; ects: number; exam: boolean; groups: Group[] }   // pro kind genau 1 Gruppe
Constraint { type: "block"; day: Day; start: string; end: string; label: string; hard: boolean }        // hard: true = fester Termin, false = Wunsch
Priority   { courseId: string; weight: 1 | 2 | 3; reason: string }          // 3 = sehr wichtig, von Gemma
Question   { question: string; options: string[] }
Understanding { intent: "reschedule" | "query"; transcript: string; constraints: Constraint[]; priorities: Priority[]; questions: Question[]; queryDay?: Day | "week" }
Choice     { courseId: string; groupId: string }
Plan       { chosen: Choice[]; dropped: string[]; conflicts: string[]; alternatives: (Choice & { reason: string })[];
             changes: { courseId: string; kind: GroupKind; from: string; to: string }[] }
CourseData { courses: Course[]; fixed: Constraint[] }                        // src/data/courses.json
Meta       { provider: string; model: string; ms: number; mock?: boolean }
```

## API-Endpunkte

| Methode | Pfad | Eingabe | Ausgabe | Besitzer |
|---|---|---|---|---|
| POST | `/api/analyze` | JSON: `{ text: string, today?: Day, provider? }` | `{ understanding: Understanding, meta: Meta }` | B |
| POST | `/api/act` | JSON: `{ constraints?: Constraint[], priorities?: Priority[], current?: Choice[] }` | `{ plan: Plan, meta: Meta }` (`meta.provider` = `solver`) | C |
| POST | `/api/speak` | JSON: `{ text: string }` | `audio/mpeg` · 501 ohne Key → Browser-Fallback | D |

Fehler immer als `{ error: string }` mit passendem HTTP-Status.

## Externe Dienste / APIs

| Dienst | Wofür | Variable(n) | Sponsor |
|---|---|---|---|
| Ollama (lokal) – **Hauptprovider** | Gemma 4 E4B (`gemma4:e4b`) auf dem Laptop – „Daten verlassen das Gerät nicht" | `OLLAMA_MODEL` | – |
| Gemini API | Gemma 4 gehostet (`gemma-4-26b-a4b-it`, `gemma-4-31b-it`), Google-Search-Grounding | `GEMINI_API_KEY`, `GEMINI_MODEL` | Google |
| DigitalOcean Inference | Gemma 4 über OpenAI-kompatiblen Endpunkt `https://inference.do-ai.run/v1` | `DO_API_KEY`, `DO_MODEL` | DigitalOcean |
| ElevenLabs | Text-to-Speech | `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` | Partner vor Ort |

Hinweis: DigitalOcean Inference bietet laut Doku aktuell **keine EU-Datenresidenz**. Datenschutz-Argument daher über den lokalen Modus (Ollama) führen, nicht über DO.
