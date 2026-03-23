# Obsidian community plugin

## Repository-specific instructions

- Plugin name: **Football Notes**
- Purpose: create structured football notes in Obsidian, starting with match note generation from user-provided inputs such as URLs.
- Core value: **structured note generation and vault organization**, not live-score dashboards or heavy embedded web UI.
- Treat external football data providers as **experimental**. Keep provider-specific logic isolated from core note generation.
- Changes should stay **issue-scoped** whenever possible. Avoid unrelated refactors unless they are required to complete the task safely.
- Preserve **user-authored note content** wherever refresh or update logic exists.
- Mobile support is not a current priority. Keep `isDesktopOnly` accurate to the implementation and avoid introducing desktop-only APIs accidentally.
- Keep dependencies small and justified. Do not add new production dependencies casually.

## Quality gates

After code changes:
- Run `npm run build`
- Run `npm run lint`
- Add or update tests when behavior changes in a meaningful way
- Do not claim validation was done unless it was actually run

## Project overview

- Target: Obsidian Community Plugin (TypeScript → bundled JavaScript)
- Entry point: `src/main.ts` compiled to `main.js` and loaded by Obsidian
- Required release artifacts: `main.js`, `manifest.json`, and optional `styles.css`

## Environment & tooling

- Node.js: use current LTS
- Package manager: **npm**
- Bundler: **esbuild**
- Types: `obsidian` type definitions

### Install

```bash
npm install
```

### Dev (watch)

```bash
npm run dev
```

### Production build

```bash
npm run build
```

## Linting

Run lint with:

```bash
npm run lint
```

Fix lint issues before finishing a task unless there is a documented reason not to.

## File & folder conventions

- Source lives in `src/`
- Keep `src/main.ts` small and focused on plugin lifecycle
- Prefer organizing feature logic into separate modules

Preferred structure:

```text
src/
  main.ts
  settings.ts
  types.ts
  commands/
  services/
  ui/
```

Guidance:
- `main.ts`: plugin bootstrap, lifecycle, command registration wiring
- `settings.ts`: settings types, defaults, settings tab
- `commands/`: command entry points
- `services/`: note generation, parsing, provider abstraction, vault operations
- `ui/`: modals, notices, custom views if needed
- `types.ts`: shared domain types

Additional rules:
- Do not commit build artifacts such as `main.js`
- Keep the plugin small
- Prefer browser-compatible packages unless desktop-only behavior is intentional
- Do not mix provider-specific fetch logic into core note generation utilities

## Manifest rules (`manifest.json`)

- Must include:
  - `id`
  - `name`
  - `version`
  - `minAppVersion`
  - `description`
  - `isDesktopOnly`
- Optional:
  - `author`
  - `authorUrl`
  - `fundingUrl`
- For local development, plugin folder name should match `id`
- Never change `id` after release
- Keep `minAppVersion` accurate when using newer APIs

## Testing

Manual install for testing:

```text
<Vault>/.obsidian/plugins/<plugin-id>/
```

Place:
- `main.js`
- `manifest.json`
- `styles.css` (if present)

Then reload Obsidian and enable the plugin in **Settings → Community plugins**.

Use a **dedicated test vault** for plugin development. Do not develop against a main personal vault.

## Commands & settings

- Add user-facing commands via `this.addCommand(...)`
- Use stable command IDs
- Provide a settings tab when configuration is needed
- Persist settings using `this.loadData()` / `this.saveData()`
- Use sensible defaults and validate settings before relying on them

## Product-specific guidance

For this repository:
- Prefer building the **match note workflow** first
- Keep note schemas explicit and Dataview-friendly
- Separate:
  - core note generation
  - vault/file operations
  - input parsing
  - external provider integration
- Refresh/update flows must avoid overwriting user-written sections
- External provider support must remain optional and failure-tolerant

## Versioning & releases

- Use Semantic Versioning
- Release workflow may evolve over time, but shipped metadata and release artifacts must stay consistent
- Keep `manifest.json` version and release artifacts consistent with the actual shipped release
- Ensure `versions.json` stays accurate when `minAppVersion` changes

## Security, privacy, and compliance

Follow Obsidian's Developer Policies and Plugin Guidelines.

In particular:
- Default to local/offline operation where practical
- Only make network requests when essential to the feature
- No hidden telemetry
- Require clear disclosure for third-party services
- Never execute remote code
- Do not access files outside the vault
- Minimize data access and respect user privacy
- Avoid spammy notifications or deceptive UI
- Register and clean up listeners properly using `register*` helpers

## UX & copy guidelines

- Prefer sentence case for headings, buttons, and titles
- Use clear, action-oriented copy
- Use **bold** for literal UI labels
- Use arrow notation for navigation: **Settings → Community plugins**
- Keep strings short and free of jargon

## Performance

- Keep startup light
- Avoid expensive work in `onload`
- Use lazy initialization where possible
- Batch disk access when reasonable
- Debounce or throttle expensive reactions to events

## Coding conventions

- TypeScript preferred with strict settings where practical
- Keep `main.ts` minimal
- Split large files before they become awkward
- Prefer clear module boundaries and explicit code
- Bundle everything into `main.js`
- Avoid Node/Electron APIs unless intentionally desktop-only
- Prefer `async/await`
- Handle errors gracefully and show useful user-facing messages when appropriate

## Mobile

- Do not assume mobile support unless it is explicitly being targeted
- If desktop-only behavior is introduced, keep `isDesktopOnly` set accurately
- Avoid accidental dependence on desktop-only APIs in shared code

## Agent do/don't

**Do**
- Keep changes scoped to the issue
- Inspect relevant files before editing
- Use Obsidian APIs for vault and file operations
- Add stable command IDs
- Provide defaults and validation in settings
- Write idempotent load/unload paths
- Run build and lint after implementation

**Don't**
- Introduce network calls without a clear user-facing reason
- Tie core plugin behavior directly to one external provider
- Add large dependencies without strong justification
- Overwrite user-authored note content in managed documents
- Perform broad rewrites when a focused change is enough

## Common implementation guidance

### Match note workflow
- Accept user input cleanly
- Validate or normalize input before use
- Generate predictable frontmatter
- Create readable markdown sections
- Keep machine-managed and user-authored sections conceptually separate

### Settings workflow
- Define explicit defaults
- Load settings early in plugin startup
- Persist updates through `saveData`
- Keep settings names stable and understandable

### Safe cleanup
Use registration helpers for listeners, DOM events, and intervals so unload is safe.

## Troubleshooting

- Plugin does not load after build:
  - ensure `main.js` and `manifest.json` are at the top level of the plugin folder
- Build issues:
  - run `npm run build`
- Commands not appearing:
  - verify registration happens during `onload`
- Settings not persisting:
  - ensure `loadData` and `saveData` are awaited
- Local dev confusion:
  - verify the plugin folder name matches the manifest `id`

## References

- Obsidian sample plugin: https://github.com/obsidianmd/obsidian-sample-plugin
- API documentation: https://docs.obsidian.md
- Developer policies: https://docs.obsidian.md/Developer+policies
- Plugin guidelines: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- Style guide: https://help.obsidian.md/style-guide
