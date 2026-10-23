# Git-Workflow – damit alle immer synchron sind

## Einmalig (heute Abend)

```bash
git clone https://github.com/Passionate-about-Passion/Hacktober26.git
cd Hacktober26
npm install
cp .env.example .env.local      # MOCK=1 ist schon an
npm run dev                     # http://localhost:3000
```

## Grundregeln

- **`main` ist immer lauffähig.** Die CI (GitHub Actions) prüft Lint, Typen und Build bei jedem Push.
- **Ein Branch pro Bereich**, kurzlebig: `a/capture-…`, `b/understand-…`, `c/act-…`, `d/voice-…`
- **Klein und oft mergen** – mindestens **jede Stunde**. Große Merges um 15:00 sind der häufigste Grund für kaputte Demos.
- **Nie `.env.local` committen.** Keys gehören nur in `.env.local` bzw. die Umgebungsvariablen des Deployments.

## Der Zyklus (alle 30–60 Min.)

```bash
git checkout main && git pull            # 1. neuesten Stand holen
git checkout -b b/json-retry             # 2. Branch für die nächste kleine Aufgabe
# … bauen …
npm run build                            # 3. lokal prüfen
git add -A && git commit -m "B: retry when JSON invalid"
git push -u origin b/json-retry          # 4. pushen, PR öffnen
# 5. Person 2 (Integration) merged – oder selbst mergen, wenn CI grün ist
git checkout main && git pull            # 6. wieder synchron
```

Wenn ihr während der Arbeit den neuesten Stand braucht:

```bash
git fetch origin && git merge origin/main
```

## Zeitplan für Merges

| Zeit | Was |
|------|-----|
| 13:00 | Erster Merge aller Bereiche → App läuft einmal komplett im Mock-Modus |
| 14:00 | Feature-Stopp |
| 15:00 | Alles in `main`, Mock aus, echte KI |
| 15:30 | Demo-Stand getaggt: `git tag demo && git push --tags` |
| 16:30 | Abgabe |

## Notfall

- **Merge-Konflikt in `types.ts` oder `page.tsx`:** Person 2 löst ihn, die anderen warten 2 Minuten.
- **`main` kaputt:** `git revert <commit>` statt Basteln. Danach in Ruhe fixen.
- **Kurz vor der Demo kaputt:** `git checkout demo` (der Tag von 15:30).
