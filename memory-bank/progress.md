# Progress

## Status: MVP working

## What works
- Repo initialised; repo-wide `.gitignore`.
- Vue 3 + Vite + TypeScript setup with `typecheck`, `build` and `test` scripts.
- Folder selection and library scan via the File System Access API.
- Per-movie `movie.toml` metadata with folder-name fallback; auto-detection of
  video, poster and subtitle files; non-fatal `warnings`.
- Poster grid with loading / empty / error / unsupported-browser states.
- Movie player: a centered modal dialog over the grid (not a full-page view),
  sized ~50vw with the video keeping its aspect ratio; autoplays on open (with a
  muted fallback when the browser blocks sound) and offers play/pause, seek,
  volume/mute, subtitle select, add external subtitle, fullscreen toggle and close.
- SRT → WebVTT conversion; subtitle labelling from language codes.
- 38 unit tests covering `fileName`, `mediaTypes`, `subtitleService` and
  `metadataLoader`.

## What's left / next
- Persist the folder handle (IndexedDB) and re-request permission on reload.
- Movie detail view (description, genres).
- Search / sort / filter; resume playback position.
- Native (Tauri/Electron) `LibrarySource` to lift codec + persistence limits.
- Component/E2E tests (would need jsdom + `@vue/test-utils`).

## Known issues / limitations
- No playback of codecs the browser cannot decode (MKV/HEVC/AC3).
- Folder access is not remembered between reloads.
- `movie.toml` validation is hand-rolled (no schema library): malformed fields
  are ignored, invalid TOML becomes a warning.
- Folder-name year parsing can misread titles that end in a year-like number.

## Evolution of decisions
- TypeScript 7 broke `vue-tsc`; pinned to `~5.9`.
- Skipped a path alias to avoid an extra Vite plugin.
- Chose a custom minimal player bar over native `controls` so the "add subtitle"
  action lives with the other controls.
