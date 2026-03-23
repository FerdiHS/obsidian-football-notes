---
name: obsidian-plugin-issue
description: Use this when implementing or updating a scoped issue in this Obsidian plugin repository. Best for issue-sized tasks involving plugin code, settings, note generation, tests, or small refactors. Do not use for large multi-issue rewrites or vague “build the whole plugin” requests.
---

# Obsidian plugin issue workflow

Follow this workflow when working on a single issue in this repository.

## Goal
Make the smallest clean change that fully addresses the requested issue without unrelated rewrites.

## Repository context
- This repository is an Obsidian community plugin written in TypeScript.
- The plugin’s core value is structured football note generation, not live-score UI.
- External provider logic must stay isolated from core note generation.
- Mobile support is not a current priority, but `isDesktopOnly` should stay accurate to the implementation.
- Preserve user-authored note content wherever update or refresh logic exists.

## Before coding
1. Read the issue or task carefully.
2. Inspect the relevant files first before editing.
3. Identify the smallest viable implementation.
4. Avoid adding new production dependencies unless clearly necessary.

## Implementation rules
- Keep changes scoped to the issue.
- Prefer explicit, readable code over clever abstractions.
- Use Obsidian APIs for vault and file operations.
- Keep plugin metadata and local folder conventions consistent.
- Do not introduce new sample-plugin leftovers or placeholder names in touched code.
- Do not mix provider-specific fetching logic into core note generation utilities.

## File organization guidance
Prefer keeping code in focused modules such as:
- `src/main.ts` for plugin bootstrap only
- `src/settings.ts` for settings types/defaults/UI wiring
- `src/commands/` for command entry points
- `src/services/` for note generation, parsing, and provider logic
- `src/types.ts` for shared domain types

Do not force this structure if the issue is tiny, but move in this direction when adding new logic.

## Validation steps
After making changes:
1. Run `npm run build`
2. Run `npm run lint`
3. If tests exist for the changed area, run the relevant tests
4. Check that the change does not obviously break plugin startup

## Expected output
When finished:
- summarize what changed
- list any follow-up issues discovered
- mention any assumptions or limitations
- avoid claiming work was done if build/lint/test was not actually run

## When not to use this skill
Do not use this skill for:
- broad product planning
- legal/provider feasibility research
- release management only tasks
- giant cross-repo or multi-milestone rewrites
