import { createBrowserLibrarySource } from './browserLibrarySource'
import type { LibrarySource } from './LibrarySource'

export { LibraryError } from './LibrarySource'
export type { LibrarySource } from './LibrarySource'
export { isDirectoryPickerSupported } from './browserLibrarySource'

/**
 * Create the {@link LibrarySource} for the current runtime.
 *
 * Only the browser implementation exists today; a native (Tauri/Electron)
 * implementation can be selected here later without touching the UI.
 */
export function createLibrarySource(): LibrarySource {
  return createBrowserLibrarySource()
}
