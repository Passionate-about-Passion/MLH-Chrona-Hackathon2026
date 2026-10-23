---
description: 30-Minuten-Routine – Checks laufen lassen, Bugs in BUGS.md, Aufgaben in PROMPT.md
model: sonnet
---

Run the bug routine. Do not fix any application code in this routine.

1. Use the **check-runner** subagent (haiku) to run the health check.
2. Use the **bug-hunter** subagent (sonnet) with the check-runner result. It reviews the changes since the last check and updates `BUGS.md`.
3. If `BUGS.md` has open P0 or P1 bugs without a task, use the **task-writer** subagent (haiku) to add them to `PROMPT.md`.
4. Report to the user in max 4 lines:
   - Status: ✅ grün / ❌ rot (+ commit)
   - Neue Bugs: IDs + Besitzer
   - Neue Aufgaben in PROMPT.md: IDs
   - **P0 → sofort im Team-Chat melden**
5. If there are changes to `BUGS.md` / `PROMPT.md`, commit them: `git add BUGS.md PROMPT.md && git commit -m "chore: bugcheck <time>" && git push` (only these two files).

$ARGUMENTS
