/**
 * Ambient declarations for File System Access API members that are not yet
 * part of TypeScript's bundled DOM library.
 *
 * This file must stay free of imports/exports so the declarations merge into
 * the global scope.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker
 */

interface FileSystemDirectoryHandle {
  /** Iterate over the direct children of this directory. */
  entries(): AsyncIterableIterator<
    [string, FileSystemFileHandle | FileSystemDirectoryHandle]
  >
}

interface DirectoryPickerOptions {
  /** Remembered identifier so the browser can reopen the same folder. */
  id?: string
  /** Requested access mode. */
  mode?: 'read' | 'readwrite'
}

interface Window {
  /** Prompt the user to choose a directory. Chromium-only. */
  showDirectoryPicker(
    options?: DirectoryPickerOptions,
  ): Promise<FileSystemDirectoryHandle>
}
