---
name: obsidian-plugin-issue
description: Use when implementing a scoped Football Notes issue involving commands, workflows, templates, vault file services, settings, modals, or nearby tests. Do not use for planning, release-only work, broad refactors, or pull-request reviews.
---

# Football Notes scoped implementation

## Component boundaries

- Commands translate Obsidian interactions into workflow calls.
- Workflows coordinate domain behavior and should use dependency injection where practical.
- Templates generate deterministic Markdown.
- File services own vault paths, existence checks, and safe note creation.
- Settings own persisted configuration and defaults.
- Modals collect and validate input without owning note-generation behavior.

## Safety requirements

- Do not overwrite existing notes unless the issue explicitly defines safe update behavior.
- Preserve user-authored content.
- Use Obsidian vault APIs for file operations.
- Keep provider-specific behavior outside core note-generation logic.
- Keep command IDs stable.
- Avoid unnecessary production dependencies.

## Errors and tests

- Use typed internal errors for expected domain failures.
- Convert expected failures into clear user-facing messages at command or UI boundaries.
- Add or update nearby tests for changed behavior.
- Manually verify changes in a dedicated Obsidian test vault when runtime wiring or UI behavior changes.
- Run focused checks while developing.
- Run `npm run check` before declaring the implementation complete.
- Do not claim validation was performed unless it was actually run.
