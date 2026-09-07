# AGENTS.md

## Project

Obsidian plugin for movie and TV watch tracking with TMDB integration. This is a single-package TypeScript project, not a monorepo.

## Commands

- `npm run dev` — run esbuild in watch mode for development
- `npm run build` — type-check with `tsc -noEmit -skipLibCheck`, then create a production bundle with esbuild
- `npm run lint` — run ESLint with `eslint-plugin-obsidianmd` and `typescript-eslint`
- `npm test` — run the Vitest regression suite
- `npm run version` — synchronize `manifest.json` and `versions.json` with the version in `package.json`

Verification requires tests, lint, and a production build.

## Architecture

Entrypoint: `src/main.ts` → bundled to `main.js` by `esbuild.config.mjs`.

Source files in `src/`:

- `main.ts` — plugin class, commands, ribbon icon, and event wiring
- `types.ts` — TypeScript interfaces, enums, and default settings
- `settings.ts` — plugin settings UI
- `tmdb-api.ts` — TMDB REST API calls using Obsidian's `requestUrl`, not `fetch`
- `record-generator.ts` — Markdown template generation and year-file append logic
- `record-parser.ts` — parser for generated watch records
- `card-wall-view.ts` — `ItemView` subclass for the poster wall
- `search-modal.ts` — TMDB search modal
- `season-modal.ts` — season-selection modal

## Key conventions

- **`main.js` is generated** — never edit it directly; edit `src/*.ts` and rebuild.
- **`styles.css` is a source file** — it is not generated and ships as-is with the plugin.
- **`manifest.json` / `versions.json`** — update them with `npm run version`; do not hand-edit their version fields.
- **Indentation** — tabs with a width of 4, per `.editorconfig`.
- **esbuild externals** — `obsidian`, `electron`, all `@codemirror/*`, `@lezer/*`, and Node built-ins are resolved by Obsidian at runtime.
- **TMDB API** — use Obsidian's `requestUrl`; all API calls belong in `src/tmdb-api.ts`.
- **UI language** — English is the default and primary language for all user-facing strings.
- **Record compatibility** — new records use English labels; the parser retains support for records created by the original Chinese version.
- **Record storage** — watch records are stored as Markdown in year files at `{folder}/{year}.md`, with summary statistics in YAML frontmatter.

## Release

Pushing a Git tag triggers `.github/workflows/release.yml`, which builds the plugin and creates a GitHub release containing `main.js`, `manifest.json`, and `styles.css`.

### Release process

1. **Confirm the code is ready**
   - `npm test` passes.
   - `npm run lint` passes.
   - `npm run build` passes (type-check and esbuild).

2. **Update `CHANGELOG.md`**
   - Add a version entry at the top using this format:

     ```markdown
     ## [x.y.z] - YYYY-MM-DD

     ### Added / Fixed / Changed

     - Description of the change
     ```

   - Commit with a message such as `docs: update changelog for x.y.z`.

3. **Update the version**
   - Set the target `version` in `package.json`.
   - Run `npm run version` to synchronize `manifest.json` and `versions.json`.
   - Commit with `chore: bump version to x.y.z`.

4. **Create and push the tag**

   ```bash
   git tag -a x.y.z -m "x.y.z: brief summary"
   git push origin main --tags
   ```

5. **Verify the GitHub release**
   - Check that [GitHub Actions](https://github.com/Kirbosh/MovieLogENG/actions) completed successfully.
   - Confirm the release contains `main.js`, `manifest.json`, and `styles.css`.
   - Confirm the release notes were extracted correctly from `CHANGELOG.md`.

### Release troubleshooting

- **The release already exists and Actions fails** — delete the existing GitHub release, then delete and recreate the local and remote tag:

  ```bash
  git tag -d x.y.z
  git push origin :refs/tags/x.y.z
  git tag -a x.y.z -m "x.y.z: summary"
  git push origin x.y.z
  ```

- **Release notes are empty** — make sure the version heading in `CHANGELOG.md` uses the exact format `## [x.y.z]` without a `v` prefix. The workflow matches `[x.y.z]`.
