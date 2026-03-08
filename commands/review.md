---
description: Review recent code changes for bugs and test gaps
allowed-tools: Read, Grep, Glob, Bash
---

Use the `code-reviewer` agent to review the relevant code changes in this workspace.

Focus on:
- bugs and behavioral regressions
- unsafe assumptions or broken contracts
- missing or weak verification
- high-risk edge cases

Return findings first, ordered by severity, with file references where possible.

If no findings are present, say so explicitly and summarize what you verified.
