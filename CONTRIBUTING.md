# Contributing

## Development setup

Use a dedicated Obsidian test vault for this plugin. Do not develop against a personal vault.

Contributor tooling in this repository currently requires Node.js 20.17 or newer.

The canonical local setup is to clone this repository directly into the plugin folder inside the test vault:

```text
<Vault>/.obsidian/plugins/football-notes
```

That keeps the generated `main.js` and `manifest.json` at the plugin root where Obsidian expects them. `styles.css` is optional and only needed if the plugin later ships CSS.

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

Before pushing significant changes or declaring an implementation complete, run:

```bash
npm run check
```

This is the canonical full validation command. It runs the test suite, production build and TypeScript checking, linting, and formatting verification.

Individual commands and focused tests remain useful during development:

```bash
npm run test
npm run build
npm run lint
npm run format:check
```

Run `npm run version:check` separately when validating release and compatibility metadata.

## Git hooks

This repository installs local Git hooks with Husky:

- `pre-commit`: runs `lint-staged` as a focused staged-file formatting and linting gate
- `pre-push`: runs `npm run test` and `npm run build` as a focused behavior and production-build gate
- `npm run check`: remains the full pre-completion and CI validation gate

The hooks are intentionally narrower than the full validation suite so routine commits and pushes retain fast feedback. They do not need to run all of `npm run check`.

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

Use `npm run version:sync` to add the next release entry to `versions.json` when Release Please opens a release PR, and to refresh that entry if the release manifest changes before merge. Use `npm run version:check` to validate the metadata before merging.
`version:check` compares the recorded `minAppVersion` against `manifest.json` in Release Please branches and release-tag builds so shipped metadata stays honest without blocking normal main-branch merges.
`versions.json` is release history, so the sync script refreshes only the current release entry in Release Please PRs and does not rewrite older shipped releases. The release PR sync workflow keeps Release Please branches aligned automatically.

To merge a Release Please PR, first synchronize the branch and wait for every check to report success. Then [FerdiHS](https://github.com/FerdiHS) should apply the `release: ready` label. A synchronization commit invalidates `release: ready`; wait for the new checks, then reapply the label. The automation also removes stale labels after conversion to draft, and removes the label with a comment when validation or merging fails. Repository auto-merge is intentionally disabled for this process. The workflow identifies the Release Please author using the required `RELEASE_PLEASE_APP_SLUG` repository Actions variable.

If metadata synchronization stops because the release branch changed or its output is unexpected, inspect and correct the Release Please PR, then let its next update trigger a new synchronization run. Do not restore branch-controlled package-script execution or force-push the synchronization commit; the workflow uses the trusted `version-bump.mjs` from the immutable PR base revision and performs a normal push only when the remote head still matches the triggering event.
