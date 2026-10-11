# Tech Context

## Stack
- Vue 3.5 (`<script setup>`, TypeScript) + Vite 8.
- TypeScript 5.9 (strict) — **pinned**: `vue-tsc@3` requires `typescript/lib/tsc`,
  which TypeScript 7 (the native port) no longer exports.
- Vitest 5 (node environment; pure-logic unit tests).
- smol-toml (runtime TOML parser).
- Package manager: npm. Node 20+.

## Commands (run in `frontend/`)
- `npm install`
- `npm run dev` — Vite dev server.
- `npm run build` — `vue-tsc -b` then `vite build`.
- `npm run typecheck` — `vue-tsc -b`.
- `npm run test` — `vitest run`.

## Config files
- `tsconfig.json` — solution file referencing the two projects below.
- `tsconfig.app.json` — extends `@vue/tsconfig/tsconfig.dom.json`; includes
  `src/**/*` (tests included so they are type-checked).
- `tsconfig.node.json` — for `vite.config.ts`.
- `src/types/file-system-access.d.ts` — ambient declarations for
  `showDirectoryPicker` and `FileSystemDirectoryHandle.entries()`, which the
  bundled DOM lib lacks.

## Browser constraints
- File System Access API is Chromium-only (`showDirectoryPicker`).
- `<video>` playback is limited to browser-decodable codecs (MP4/H.264/AAC, WebM).

## Dependencies
- Runtime: `vue`, `smol-toml`.
- Dev: `vite`, `@vitejs/plugin-vue`, `typescript`, `vue-tsc`, `@vue/tsconfig`,
  `vitest`.
