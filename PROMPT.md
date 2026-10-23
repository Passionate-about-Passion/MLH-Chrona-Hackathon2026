# Aufgaben als fertige Prompts

Jede Aufgabe ist ein Prompt, den eine frische Claude-Session allein abarbeiten kann.
Anlegen: `/new-task <beschreibung>` (oder `task-writer` nach `/bugcheck`). Abarbeiten: `/next-task <A|B|C|D>`.
Nichts löschen: Erledigtes nach unten verschieben. Ab **14:00** nur noch Bugfixes und Demo-Stabilität.

## Vorlage

```
### TASK-### · <Titel>
- Bereich: A|B|C|D · Modell: haiku|sonnet|opus · Prio: P0|P1|Feature · Bug: BUG-### (optional)
- Status: offen | 🔄 in Arbeit (Name) | erledigt (<commit>)
> Ziel: <ein Satz>
> Dateien: <pfade>
> Fertig, wenn: <Befehl oder Klickpfad, der es beweist>
> Nicht anfassen: <was tabu ist>
```

## Offen

### TASK-001 · Prompt für die gewählte Idee schreiben
- Bereich: B · Modell: opus · Prio: Feature
- Status: offen
> Ziel: `ANALYZE_SYSTEM` in `src/lib/prompts.ts` auf die um 11:30 gewählte Idee zuschneiden, Ausgabe passt zu `Analysis` in `src/lib/types.ts`.
> Dateien: `src/lib/prompts.ts` (nur `ANALYZE_SYSTEM`)
> Fertig, wenn: 3 Demo-Fotos aus `public/samples/` liefern über `/api/analyze` gültiges JSON mit sinnvollen Aktionen.
> Nicht anfassen: `types.ts` ohne Teamabsprache.

### TASK-002 · Aktionen für die gewählte Idee
- Bereich: C · Modell: sonnet · Prio: Feature
- Status: offen
> Ziel: `ACT_SYSTEM` und die Aktionstypen an die Idee anpassen (2–3 Aktionen, die in der Demo gezeigt werden).
> Dateien: `src/lib/prompts.ts` (nur `ACT_SYSTEM`), `src/app/api/act/route.ts`
> Fertig, wenn: Jede Aktion liefert im Mock und mit echter KI in < 10 s ein Ergebnis.
> Nicht anfassen: `ANALYZE_SYSTEM`.

### TASK-003 · Look & Feel der App
- Bereich: D · Modell: sonnet · Prio: Feature
- Status: offen
> Ziel: Farben, Schrift, Startbildschirm passend zur Idee (Skill `frontend-design`), Projektname und Ein-Satz-Pitch im Header.
> Dateien: `src/app/globals.css`, `src/app/page.tsx` (nur Header), `src/features/voice/`
> Fertig, wenn: App sieht auf Handy (390 px) und Beamer gut aus, `bash scripts/check.sh` grün.
> Nicht anfassen: Logik in `src/features/capture|understand|act`.

### TASK-004 · Demo-Fotos und Kamera-Flow
- Bereich: A · Modell: haiku · Prio: Feature
- Status: offen
> Ziel: 2–3 starke Demo-Fotos in `public/samples/`, Upload-Text in `CaptureCard.tsx` an die Idee anpassen.
> Dateien: `public/samples/`, `src/features/capture/CaptureCard.tsx`
> Fertig, wenn: Foto vom Handy → Analyse erscheint.
> Nicht anfassen: API-Routen.

## Erledigt
