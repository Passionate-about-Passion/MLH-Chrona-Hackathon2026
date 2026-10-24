# Sprachfunktion einbauen

Die Oberfläche (`/mockup`) spricht nur mit der Schnittstelle `VoiceService` aus `src/voice/`. Wer die Sprachfunktion baut, ändert **nur** Dateien in `src/voice/`, nie die UI.

## Wo die UI den Service aufruft

Alles passiert in `src/components/timetable/VoiceOverlay.tsx`. Die Datei importiert `voice` aus `@/voice`.

| Schritt in der UI | Aufruf | Erwartung |
|---|---|---|
| Mikrofon-Button in der Mitte öffnet das Overlay | `voice.startListening()` | beginnt die Aufnahme |
| Nutzer:in tippt „Fertig" | `voice.stopListening()` | liefert `Transcript` = `{ text, lang: "de" }` (Speech-to-Text) |
| direkt danach | `voice.parseIntent(transcript)` | liefert `ParsedIntent` (Sprachmodell, siehe unten) |
| Bestätigungskarte ist sichtbar und „Antwort vorlesen" ist an | `voice.speak(frage)` | liest die Rückfrage vor (Text-to-Speech) |
| „Abbrechen" oder Overlay schließen | `voice.stopListening()` | Ergebnis wird verworfen |

## Erwartetes JSON von `parseIntent`

```ts
type ParsedIntent =
  | { type: "block_time"; date: "2026-10-22"; start: "14:00"; end: "16:00"; title?: string; fixed: true }
  | { type: "set_course_weight"; courseId: "c-math"; weight: 5 } // weight 1-5
  | { type: "unknown" };
```

- `date` ist ein ISO-Datum (`yyyy-mm-dd`). „Donnerstag" muss das Sprachmodell oder der Service anhand des heutigen Datums in ein konkretes Datum umrechnen.
- Zeiten sind `HH:MM` im 24-Stunden-Format.
- `courseId` muss eine ID aus `src/data/sample.ts` sein (z. B. `c-math`). Die Kursliste steht in `sampleCourses`.
- Versteht das Modell die Eingabe nicht, gibt es `{ "type": "unknown" }` zurück. Die UI zeigt dann „Das habe ich nicht verstanden." und bietet „Nochmal sprechen" an.
- Wirft ein Aufruf einen Fehler, zeigt die UI „Die Sprachfunktion ist gerade nicht erreichbar."

Passende Komponenten laut Konzept: Speech-to-Text mit IBM Granite Speech, `parseIntent` mit Gemma 4 (über `ask()` aus `src/lib/ai.ts`, mit `json: true`), Text-to-Speech mit ElevenLabs (siehe `src/app/api/speak/route.ts`).

## Mock austauschen

1. Neue Datei anlegen, z. B. `src/voice/realVoiceService.ts`, die `VoiceService` aus `./types` implementiert.
2. In `src/voice/index.ts` die letzte Zeile ändern:

   ```ts
   import { realVoiceService } from "./realVoiceService";
   export const voice: VoiceService = realVoiceService;
   ```

3. Fertig. `mockVoiceService.ts` kann für Tests und die Offline-Demo bleiben. Er liefert immer „Donnerstag 14–16 Uhr, fester Termin".

## Sicherheitsregel: erst fragen, dann ändern

Die Bestätigungskarte („Ich blockiere Donnerstag, 14:00–16:00 Uhr als festen Termin. Stimmt das?" mit Ja/Nein) erscheint **immer vor jeder Planänderung**. Der Plan ändert sich erst nach „Ja", Aufruf `applyIntent` in `TimetableApp.tsx`. Danach öffnet sich bei einem Konflikt das Popup mit Alternativen, und jede Verschiebung braucht noch einmal „Übernehmen". Ein Service darf den Plan nie selbst verändern. Er liefert nur Text und `ParsedIntent`.
