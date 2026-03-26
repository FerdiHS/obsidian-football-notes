# Football Notes

Football Notes is an Obsidian community plugin for creating structured football notes. The initial focus is match note generation from user-provided inputs such as URLs, while keeping notes predictable, vault-friendly, and easy to extend.

## Status

This repository is currently in the bootstrap phase. The immediate goal is to replace the sample-plugin scaffold with a clean foundation for real feature work.

Planned focus areas:

- structured match note generation
- explicit, Dataview-friendly note schemas
- isolated provider integrations
- preserving user-authored note content during refresh flows

## Development

Requirements:

- Node.js >= 20.17 (current LTS or newer)
- npm

Commands:

```bash
npm install
npm run dev
npm run build
npm run lint
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full contributor workflow, including the dedicated dev-vault setup and local Git hooks.

## Releases

Releases are managed with Release Please and Conventional Commits.

- `feat:` commits drive minor releases
- `fix:` commits drive patch releases
- `feat!:` / `fix!:` / `refactor!:` and other `!` commits mark breaking changes
- `chore:`, `docs:`, and most `refactor:` commits do not trigger releases on their own

Release Please updates `package.json`, `package-lock.json`, `manifest.json`, and `CHANGELOG.md`.
If you raise `manifest.json` `minAppVersion`, update `versions.json` manually in the same PR.

## Local testing

Use a dedicated Obsidian test vault for development.

Install the plugin into:

```text
<Vault>/.obsidian/plugins/obsidian-football-notes/
```

and place `main.js`, `manifest.json`, and `styles.css` there.

For the recommended direct-checkout workflow and local hook setup, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Project principles

- keep core note generation separate from provider-specific fetch logic
- avoid unnecessary production dependencies
- keep `src/main.ts` focused on plugin lifecycle
- keep `isDesktopOnly` accurate to the implementation

## References

- [Obsidian API documentation](https://docs.obsidian.md)
- [Plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
