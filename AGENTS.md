# Football Notes repository guidance

## Project context

Football Notes is an Obsidian community plugin for creating and organizing structured football notes.

See:

- [`README.md`](README.md) for product scope and high-level development guidance.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) for setup, validation details, Git hooks, releases, and troubleshooting.

## Repository map

- `src/main.ts`: plugin lifecycle and top-level wiring.
- `src/commands/`: Obsidian command entry points.
- `src/services/`: workflows, templates, parsing, provider integration, and vault file services.
- `src/ui/`: modals and other user-interface components.
- `src/settings.ts`: persisted settings, defaults, and settings UI.
- `src/types.ts`: shared domain types.
- `*.test.ts`: nearby tests for the corresponding behavior.

## Repository invariants

- Keep changes scoped to the requested issue and avoid unrelated refactors.
- Preserve user-authored note content.
- Keep provider-specific logic isolated from core note generation.
- Use Obsidian APIs for vault and file operations.
- Keep `src/main.ts` focused on plugin lifecycle and top-level wiring.
- Keep existing command IDs stable.
- Avoid unnecessary production dependencies.
- Do not commit the generated `main.js`.
- Keep `isDesktopOnly` and compatibility metadata accurate.
- Avoid accidental use of desktop-only APIs in shared code.
- Do not add hidden telemetry, execute remote code, or access files outside the vault.
- Keep note creation safe and do not overwrite existing notes unless explicitly required.
- Use typed errors for expected failures and present useful messages at command or UI boundaries.

## Implementation guidance

- Follow the existing command, workflow, template, file-service, settings, and modal boundaries.
- Prefer dependency-injected workflows where practical.
- Keep templates deterministic and note schemas explicit.
- Add or update nearby tests when behavior changes.
- Run focused checks during development.

## Validation

Before declaring a change complete, run:

```bash
npm run check
```

This runs the test suite, production build and TypeScript checking, linting, and formatting verification.

Do not claim validation was performed unless the command was actually run.