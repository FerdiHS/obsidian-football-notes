# Football Notes

Football Notes is an Obsidian community plugin for creating structured football notes. The initial focus is match note generation from user-provided inputs such as URLs, while keeping notes predictable, vault-friendly, and easy to extend.

## Status

This repository is in an early MVP state focused on structured match-note generation and a stable contributor workflow.

Planned focus areas:

- structured match note generation
- explicit, Dataview-friendly note schemas
- isolated provider integrations
- preserving user-authored note content during refresh flows

## Usage

### Installation

- For end-user installs, download `main.js` and `manifest.json` from the relevant GitHub release and copy them into `<Vault>/.obsidian/plugins/football-notes/`.
- If you're developing from source, use the direct-checkout workflow in [CONTRIBUTING.md](./CONTRIBUTING.md).

### Commands

- `Create match note from URL`: validate a football match URL, create a structured placeholder note, and open it. It does not fetch teams, scores, dates, lineups, statistics, or provider data.
- `Create match note manually`: collect home team, away team, match date, competition, and optional source URL; reuse or create linked team notes; then create the match note.
- `Create team note`: create or reuse a team note from a team name.
- `Create player note`: create or reuse a player note from a player name.

### Settings and generated notes

- Match notes use `Football notes/matches` by default, team notes use `Football notes/teams`, and player notes use `Football notes/players`.
- Folder values are vault-relative and normalized before use.
- Existing compatible team and player notes are reused instead of duplicated.
- Match notes are not reused solely because a generated path is occupied; the plugin chooses an available filename instead.
- The plugin avoids overwriting existing notes and reports folder or incompatible-note collisions clearly.
- Manual match note home and away teams must be different. Names that resolve to the same sanitized, case-insensitive team-note path are rejected.
- Manual match creation can leave already-created team notes in the vault if match-note creation fails later.
- See the [canonical match note schema](./docs/match-note-schema.md) and [team/player note schemas](./docs/team-player-note-schema.md) for the note shapes.

### Limitations

- No provider-backed fetching yet.
- No score extraction, statistics extraction, or lineup extraction yet.
- No automatic player creation from matches yet.
- No fuzzy alias matching yet.
- No automatic rewriting of existing user-authored notes yet.

## Development

Requirements:

- Node.js >= 20.17 (current LTS or newer)
- npm

Common development commands:

```bash
npm install
npm run dev
npm run build
npm run lint
```

Before completing or submitting a change, run the full validation suite:

```bash
npm run check
```

Individual commands and focused tests may still be used during development.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full contributor workflow, including the dedicated dev-vault setup, validation details, and local Git hooks.

## Releases

Releases are managed with Release Please and Conventional Commits.

- `feat:` commits drive minor releases
- `fix:` commits drive patch releases
- `feat!:` / `fix!:` / `refactor!:` and other `!` commits mark breaking changes
- `chore:`, `docs:`, and most `refactor:` commits do not trigger releases on their own

Release Please updates `package.json`, `package-lock.json`, `manifest.json`, and `CHANGELOG.md`.
`versions.json` stores release history, so `npm run version:sync` adds the next missing release entry and refreshes the current release entry in Release Please PRs when the manifest changes, while `npm run version:check` validates the metadata before merging.
`version:check` compares the current release entry against `manifest.json` in Release Please branches and release-tag builds so shipped compatibility metadata stays in sync without blocking normal main-branch merges.
Release Please release PRs are synced automatically before merge.

## Local testing

Use a dedicated Obsidian test vault for development.

Install the plugin into:

```text
<Vault>/.obsidian/plugins/football-notes/
```

and place `main.js` and `manifest.json` there. Add `styles.css` only if the plugin later ships CSS.

For the recommended direct-checkout workflow and local hook setup, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Project principles

- keep core note generation separate from provider-specific fetch logic
- avoid unnecessary production dependencies
- keep `src/main.ts` focused on plugin lifecycle
- keep `isDesktopOnly` accurate to the implementation

## References

- [Obsidian API documentation](https://docs.obsidian.md)
- [Plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
