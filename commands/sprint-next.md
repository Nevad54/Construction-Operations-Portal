---
description: Recommend the next sprint task from SPRINT_BOARD.md
allowed-tools: Read, Grep, Glob
---

Read [SPRINT_BOARD.md](/d:/Web%20App/Construction%20Operations%20Portal/SPRINT_BOARD.md) and determine the most sensible next task to work on.

Use this process:

1. Inspect `Current Status`.
2. Inspect the most recent sprint sections near the end of the file.
3. Inspect `Next 7-Day Focus`.
4. Distinguish completed items from actual pending work.
5. If the board is stale or only lists completed items, infer the next highest-leverage task from the most recent unfinished gap or known reliability/UI issue in the board.

Return:

## Next Recommendation
- one clear recommended next task
- why it is highest leverage right now

## Secondary Options
- up to two fallback tasks only if they are materially distinct

## Board Issues
- note any sprint-board problems such as stale focus lists, completed items still shown as next, or contradictory status

Keep the response concise and decision-oriented.
