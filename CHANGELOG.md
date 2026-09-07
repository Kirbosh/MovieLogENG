# Changelog

## [Unreleased]

### Changed

- Converted the complete user interface, commands, notices, generated Markdown templates, documentation, and test suite to English.
- Changed the default TMDB metadata language to English (`en-US`).
- Kept parser compatibility with watch records created by the original Chinese version.

## [0.8.4] - 2026-07-28

### Fixed

- Validated watch dates and personal ratings, and used local dates to prevent UTC timezone offsets from writing the wrong date.
- Fixed empty personal ratings being parsed as `NaN` and malformed historical ratings interrupting card-wall rendering.
- Fixed personal ratings of 0 not being preserved; they now display as `0.0/10`.
- Fixed local poster-cache collisions between TV seasons and between movies and TV shows with the same ID.
- Limited the persistent TMDB cache size and removed expired or malformed cache data.
- Used dedicated movie and TV search endpoints and prevented older search responses from replacing newer results.

### Changed

- Added regression tests for record parsing, rating display, form validation, sorting, poster caching, and TMDB caching.
- Changed the release workflow to use `npm ci` and require lint and build checks before publishing.
- Removed the unimplemented card-size setting from the README and clarified that only desktop is supported.

## [0.8.3] - 2026-06-13

### Fixed

- Raised `minAppVersion` from `1.6.0` to `1.7.2` because `workspace.revealLeaf()` began returning `Promise<void>` in Obsidian 1.7.2, resolving the `obsidianmd/no-unsupported-api` error.

## [0.8.2] - 2026-06-13

### Fixed

- Raised `minAppVersion` from `1.5.0` to `1.6.0`, the actual minimum version required by `revealLeaf`.

## [0.8.1] - 2026-06-13

### Fixed

- Raised `minAppVersion` from `0.15.0` to `1.5.0` because the plugin used newer APIs such as `revealLeaf` and `openLinkText`.
- Fixed several unawaited Promise warnings in `activateCardWall`, `saveData`, and `revealLeaf`.
- Fixed type warnings caused by passing async callbacks where a void return value was expected.
- Fixed unsafe `any` assignment warnings involving `loadData()` and `response.json`.
- Added the `window.` prefix to `setTimeout` and `clearTimeout` for pop-out window compatibility.
- Added `.opencode/` to the ESLint ignore list to prevent unrelated files from being reported.

## [0.8.0] - 2026-06-13

### Added

- Local poster caching in the `_posters` directory to avoid requesting remote images on every load.
- An **Enable poster cache** toggle in the settings panel.
- An in-memory TMDB API cache with persistence in `data.json`.
- A `writingPaths` mechanism that skips `modify` and `create` event handling while the plugin writes files, preventing refresh loops.
- A fallback display with a TMDB link when a poster fails to load.

### Fixed

- Fixed the poster wall not refreshing after a movie record was added because the `vault.on('create')` listener was missing.
- Fixed the poster wall showing “Poster unavailable” when a local poster file did not exist.
- Fixed `resolveLocalPosterUrl` returning an invalid path for a missing file and causing the `<img>` element to fail.
- Removed an invalid decrement branch from `updateYearFileStats`.

### Changed

- Added a 300 ms debounce to card-wall refreshes.
- Cached year files by modification time and read them in parallel, substantially improving poster-wall load performance.
- Split `doRefresh` into `loadAllRecords` and `renderFilteredView` to separate data loading from rendering.
- Wrapped each file read in `loadAllRecords` with `try/catch` so one damaged file does not break the entire view.
- Changed `refreshCards` to use `.catch()` so errors are no longer silently discarded.
- Added a shared `reportError` helper to replace catch blocks that only showed a `Notice`.
- Changed the open-source license to MIT.
- Upgraded Node.js to version 24.x.

## [0.7.0] - 2026-06-13

- Added year filtering to the poster wall.
- Added a vertical layout for narrow panels.
- Added sorting by watch date, title, rating, or release date.
- Added separate record types for movies and TV seasons.
- Added watch-status tracking: planned, watching, completed, and dropped.
- Added personal ratings and reviews.
