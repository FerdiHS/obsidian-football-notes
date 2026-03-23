# Contributing

## Development setup

Use a dedicated Obsidian test vault for this plugin. Do not develop against a personal vault.

The canonical local setup is to clone this repository directly into the plugin folder inside the test vault:

```text
<Vault>/.obsidian/plugins/obsidian-football-notes
```

That keeps the generated `main.js`, `manifest.json`, and `styles.css` at the plugin root where Obsidian expects them.

## Local workflow

1. Create a dedicated Obsidian test vault.
2. Clone this repository into:

    ```text
    <Vault>/.obsidian/plugins/obsidian-football-notes
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
