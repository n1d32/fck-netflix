# Active Context

## Current focus
MVP is complete: TypeScript migration, library scanning, poster grid, player
with subtitles, unit tests, and this memory bank. Awaiting user feedback or the
next feature to pick up.

## Recent changes
- Initialised the git repo and a repo-wide `.gitignore`.
- Migrated the Vite Vue scaffold to TypeScript; removed template demo files.
- Pinned TypeScript to `~5.9` — `vue-tsc@3` is incompatible with the TS 7 native
  port that a plain `npm install typescript` now pulls in.
- Added the library layer behind a `LibrarySource` interface, the `movie.toml`
  metadata loader, the poster grid and the movie player with subtitle support.
- Added Vitest unit tests for all pure logic.

## Next steps (candidates)
- Persist the chosen folder handle in IndexedDB and re-request permission on
  reload (`queryPermission`/`requestPermission`).
- Movie detail view/overlay (description, genres); surface `warnings` better.
- Search / sort / filter the grid; remember and resume the last position.
- Native (Tauri/Electron) `LibrarySource` to lift codec and persistence limits.

## Decisions & considerations
- Keep disk access and playback URLs inside `LibrarySource`; components receive
  only plain `Movie` data. Handles never leak into the UI.
- Metadata priority: `movie.toml` → auto-detected files → folder name.
- No path alias (`@/`); relative imports keep the Vite config minimal.

## Patterns / preferences
- Small, composable SFCs; business logic in `services/`, state in `composables/`.
- Strict TypeScript, explicit `import type`, descriptive names, no dead code.
- Tests live next to the code in `__tests__/` and cover pure logic only.
