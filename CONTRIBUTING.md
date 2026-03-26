# Contributing

## Development setup

Use a dedicated Obsidian test vault for this plugin. Do not develop against a personal vault.

Contributor tooling in this repository currently requires Node.js 20.17 or newer.

The canonical local setup is to clone this repository directly into the plugin folder inside the test vault:

```text
<Vault>/.obsidian/plugins/football-notes
```

That keeps the generated `main.js`, `manifest.json`, and `styles.css` at the plugin root where Obsidian expects them.

## Local workflow

1. Create a dedicated Obsidian test vault.
2. Clone this repository into:

    ```text
    <Vault>/.obsidian/plugins/football-notes
    ```

3. Install dependencies:

    ```bash
    npm install
    ```

4. Start the development build:

    ```bash
    npm run dev
    ```

5. Open the test vault in Obsidian and enable **Football Notes** under **Settings → Community plugins**.
6. After code changes, reload Obsidian or reload the plugin to pick up the updated build output.

## Validation commands

Run these before pushing significant changes:

```bash
npm run build
npm run lint
npm run format:check
```

## Git hooks

This repository installs local Git hooks with Husky:

- `pre-commit`: runs `lint-staged` to format and lint staged files
- `pre-push`: runs `npm run build`

If hooks stop working after reinstalling dependencies, run:

```bash
npm run prepare
```

## Commit conventions and releases

This repository uses Conventional Commits because Release Please reads commit history to prepare release PRs.

- `feat:` creates a minor version bump
- `fix:` creates a patch version bump
- `feat!:` / `fix!:` / `refactor!:` and other `!` commits mark breaking changes
- `chore:`, `docs:`, and most `refactor:` commits do not trigger releases by themselves

Release Please manages `package.json`, `package-lock.json`, `manifest.json`, and `CHANGELOG.md` after merges to `main`.
Tags intentionally omit a leading `v` so Git tags match the Obsidian plugin version format.

If you change `manifest.json` `minAppVersion`, update `versions.json` manually in the same PR. Obsidian only needs a new `versions.json` entry when the minimum supported app version changes.

If you want the normal CI workflow to run on Release Please PRs too, configure a `RELEASE_PLEASE_TOKEN` secret with repo write access. The release workflow falls back to `GITHUB_TOKEN` if that secret is not set.
