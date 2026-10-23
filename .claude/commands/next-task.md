---
description: Nächste offene Aufgabe aus PROMPT.md für meinen Bereich holen und mit dem passenden Modell umsetzen
argument-hint: "<Bereich A|B|C|D>"
---

My slice is: $ARGUMENTS

1. `git pull`.
2. Open `PROMPT.md`, take the first task under **Offen** whose owner is my slice (P0 before P1 before features). Mark it `🔄 in Arbeit` and commit+push that one-line change so nobody else takes it.
3. Run it with the model the task names:
   - `haiku` or `sonnet` → delegate to the **slice-builder** subagent (pass the full task text; for haiku tasks say "keep it minimal")
   - `opus` → do it yourself in this session, using the `writing-plans` skill first if it touches more than 2 files
4. When done: the task is under **Erledigt** with commit hash, `bash scripts/check.sh` is green. Show me the result and ask before pushing.
