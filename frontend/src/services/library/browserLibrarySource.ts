import type { Movie, SubtitleTrack } from '../../types/movie'
import { isImageFile, isSubtitleFile, isVideoFile } from '../../utils/mediaTypes'
import { createMovieFromFolder, type MovieFolderScan } from '../metadataLoader'
import { LibraryError, type LibrarySource } from './LibrarySource'

const METADATA_FILE_NAME = 'movie.toml'

interface MovieRecord {
  movie: Movie
  directory: FileSystemDirectoryHandle
}

/** Whether the File System Access API is available in this environment. */
export function isDirectoryPickerSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

/**
 * {@link LibrarySource} backed by the File System Access API.
 *
 * Only meaningful in Chromium-based browsers; callers should check
 * {@link isDirectoryPickerSupported} first.
 */
export function createBrowserLibrarySource(): LibrarySource {
  let root: FileSystemDirectoryHandle | null = null
  const records = new Map<string, MovieRecord>()
  const posterUrls = new Map<string, string>()
  const videoUrls = new Map<string, string>()

  async function pickRoot(): Promise<boolean> {
    if (!isDirectoryPickerSupported()) {
      throw new LibraryError('This browser does not support reading local folders.')
    }
    try {
      root = await window.showDirectoryPicker({ id: 'localflix-library', mode: 'read' })
      return true
    } catch (error) {
      if (isAbortError(error)) return false
      throw new LibraryError('Could not open the selected folder.')
    }
  }

  async function scanMovies(): Promise<Movie[]> {
    if (root === null) {
      throw new LibraryError('No library folder has been selected yet.')
    }

    records.clear()
    const movies: Movie[] = []

    for await (const [folderName, handle] of root.entries()) {
      if (handle.kind !== 'directory') continue
      const record = await readMovieFolder(folderName, handle)
      if (record === null) continue
      records.set(record.movie.id, record)
      movies.push(record.movie)
    }

    return movies.sort((a, b) => a.title.localeCompare(b.title))
  }

  async function readSubtitle(movie: Movie, subtitle: SubtitleTrack): Promise<string> {
    const record = records.get(movie.id)
    if (record === undefined) {
      throw new LibraryError('The movie is no longer available.')
    }
    const file = await readFile(record.directory, subtitle.fileName)
    return file.text()
  }

  function dispose(): void {
    revokeAll(posterUrls)
    revokeAll(videoUrls)
    records.clear()
    root = null
  }

  async function readMovieFolder(
    folderName: string,
    directory: FileSystemDirectoryHandle,
  ): Promise<MovieRecord | null> {
    const scan: MovieFolderScan = {
      folderName,
      videoFiles: [],
      subtitleFiles: [],
      posterFiles: [],
    }

    for await (const [, handle] of directory.entries()) {
      if (handle.kind !== 'file') continue
      const fileName = handle.name
      if (isVideoFile(fileName)) scan.videoFiles.push(fileName)
      else if (isSubtitleFile(fileName)) scan.subtitleFiles.push(fileName)
      else if (isImageFile(fileName)) scan.posterFiles.push(fileName)
    }

    // A folder without a video is not a movie.
    if (scan.videoFiles.length === 0) return null

    const tomlText = await readOptionalTextFile(directory, METADATA_FILE_NAME)
    return { movie: createMovieFromFolder(scan, tomlText), directory }
  }

  async function getCachedUrl(
    cache: Map<string, string>,
    movieId: string,
    fileName: string | undefined,
  ): Promise<string | undefined> {
    if (fileName === undefined) return undefined

    const cached = cache.get(movieId)
    if (cached !== undefined) return cached

    const record = records.get(movieId)
    if (record === undefined) return undefined

    const file = await readFile(record.directory, fileName)
    const url = URL.createObjectURL(file)
    cache.set(movieId, url)
    return url
  }

  return {
    isSupported: isDirectoryPickerSupported(),
    pickRoot,
    scanMovies,
    getPosterUrl: (movie) => getCachedUrl(posterUrls, movie.id, movie.posterFileName),
    getVideoUrl: (movie) => getCachedUrl(videoUrls, movie.id, movie.videoFileName),
    readSubtitle,
    dispose,
  }
}

async function readOptionalTextFile(
  directory: FileSystemDirectoryHandle,
  fileName: string,
): Promise<string | null> {
  try {
    const handle = await directory.getFileHandle(fileName)
    return await (await handle.getFile()).text()
  } catch (error) {
    if (isNotFoundError(error)) return null
    throw new LibraryError(`Could not read ${fileName}.`)
  }
}

async function readFile(
  directory: FileSystemDirectoryHandle,
  fileName: string,
): Promise<File> {
  try {
    const handle = await directory.getFileHandle(fileName)
    return await handle.getFile()
  } catch {
    throw new LibraryError(`Could not read file: ${fileName}`)
  }
}

function revokeAll(cache: Map<string, string>): void {
  for (const url of cache.values()) URL.revokeObjectURL(url)
  cache.clear()
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'NotFoundError'
}
