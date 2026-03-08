# Claude Plugin Assets

This repository includes a Claude Code plugin layout for workspace-local agents and skills.

## Structure

- [plugin.json](/d:/Web%20App/Construction%20Operations%20Portal/.claude-plugin/plugin.json): plugin manifest
- [commands/](/d:/Web%20App/Construction%20Operations%20Portal/commands): slash-command entry points
- [agents/](/d:/Web%20App/Construction%20Operations%20Portal/agents): auto-discovered agent definitions
- [skills/](/d:/Web%20App/Construction%20Operations%20Portal/skills): auto-discovered skill packages
- [hooks/hooks.json](/d:/Web%20App/Construction%20Operations%20Portal/hooks/hooks.json): lightweight completion hooks for review-aware stop behavior

## Current Commands

- [review.md](/d:/Web%20App/Construction%20Operations%20Portal/commands/review.md): direct entry point for findings-first code review using the `code-reviewer` agent
- [ui-audit.md](/d:/Web%20App/Construction%20Operations%20Portal/commands/ui-audit.md): direct entry point for UI and UX auditing using the `ui-auditor` agent
- [sprint-next.md](/d:/Web%20App/Construction%20Operations%20Portal/commands/sprint-next.md): reads the sprint board and recommends the most sensible next task, including stale-board callouts when planning has drifted

## Current Agents

- [code-reviewer.md](/d:/Web%20App/Construction%20Operations%20Portal/agents/code-reviewer.md): autonomous review agent for findings-first code review before completion or on explicit review requests
- [ui-auditor.md](/d:/Web%20App/Construction%20Operations%20Portal/agents/ui-auditor.md): UI and UX audit agent for page-level and component-level visual review, screenshot inspection, and polish passes

## How It Is Wired

The manifest registers these component paths:

- `"commands": "./commands"`
- `"agents": "./agents"`
- `"skills": "./skills"`
- `"hooks": "./hooks/hooks.json"`

This matches the standard Claude plugin layout:

```text
.claude-plugin/plugin.json
commands/
agents/
skills/
hooks/
```

## Usage Notes

- Add new slash commands as Markdown files under `commands/`.
- Add new agent files as Markdown documents under `agents/`.
- Add new skill packages as subdirectories under `skills/` with a `SKILL.md`.
- Add hook configuration in `hooks/hooks.json` when you want lightweight automation around completion or tool usage.
- Keep command, agent, and skill filenames in kebab-case.
- If commands or hooks are added later, register them through the same plugin structure.
