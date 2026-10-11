import { parse } from 'smol-toml'
import type { MetadataSource, Movie, SubtitleTrack } from '../types/movie'
import {
  parseFolderName,
  stripExtension,
  subtitleLabelFromFileName,
} from '../utils/fileName'

/** Files discovered directly inside a movie folder (names only). */
export interface MovieFolderScan {
  folderName: string
  videoFiles: string[]
  subtitleFiles: string[]
  posterFiles: string[]
}

/** Metadata as expressed in a `movie.toml` file. */
export interface MovieTomlData {
  title?: string
  year?: number
  genres?: string[]
  description?: string
  videoFileName?: string
  posterFileName?: string
  subtitles?: SubtitleTrack[]
}

const PREFERRED_POSTER_NAMES = new Set(['poster', 'folder', 'cover'])

/**
 * Parse the contents of a `movie.toml` file.
 *
 * Unrecognised or malformed fields are ignored rather than rejected, so a
 * partially-wrong file still yields useful metadata.
 *
 * @throws {TomlError} when the TOML itself cannot be parsed.
 */
export function parseMovieToml(text: string): MovieTomlData {
  const table = parse(text) as Record<string, unknown>
  const data: MovieTomlData = {}

  const title = asNonEmptyString(table.title)
  if (title !== undefined) data.title = title

  const year = asInteger(table.year)
  if (year !== undefined) data.year = year

  const description = asNonEmptyString(table.description)
  if (description !== undefined) data.description = description

  const genres = asStringArray(table.genres)
  if (genres !== undefined) data.genres = genres

  const videoFileName = asNonEmptyString(table.video)
  if (videoFileName !== undefined) data.videoFileName = videoFileName

  const posterFileName = asNonEmptyString(table.poster)
  if (posterFileName !== undefined) data.posterFileName = posterFileName

  const subtitles = asSubtitleList(table.subtitles)
  if (subtitles !== undefined) data.subtitles = subtitles

  return data
}

/**
 * Build a {@link Movie} from a folder scan, merging optional `movie.toml`
 * metadata with auto-detected files and folder-name fallbacks.
 *
 * Resolution order per field: `movie.toml` → auto-detected file → folder name.
 */
export function createMovieFromFolder(
  scan: MovieFolderScan,
  tomlText?: string | null,
): Movie {
  const warnings: string[] = []
  let metadata: MovieTomlData = {}
  let metadataSource: MetadataSource = 'folder-name'

  if (tomlText != null) {
    try {
      metadata = parseMovieToml(tomlText)
      metadataSource = 'toml'
    } catch (error) {
      warnings.push(describeTomlError(error))
    }
  }

  const { title: folderTitle, year: folderYear } = parseFolderName(scan.folderName)

  return {
    id: scan.folderName,
    folderName: scan.folderName,
    title: metadata.title ?? folderTitle,
    year: metadata.year ?? folderYear,
    genres: metadata.genres ?? [],
    description: metadata.description,
    posterFileName: resolvePoster(metadata.posterFileName, scan.posterFiles, warnings),
    videoFileName: resolveVideo(metadata.videoFileName, scan.videoFiles, warnings),
    subtitles: resolveSubtitles(metadata.subtitles, scan.subtitleFiles, warnings),
    metadataSource,
    warnings,
  }
}

/** Prefer a conventionally-named poster, otherwise the first image found. */
export function pickPosterFile(files: string[]): string | undefined {
  const sorted = files.slice().sort()
  const preferred = sorted.find((file) =>
    PREFERRED_POSTER_NAMES.has(stripExtension(file).toLowerCase()),
  )
  return preferred ?? sorted[0]
}

/** Turn detected subtitle file names into subtitle tracks. */
export function detectSubtitles(files: string[]): SubtitleTrack[] {
  return files
    .slice()
    .sort()
    .map((fileName, index) => ({
      fileName,
      label: subtitleLabelFromFileName(fileName),
      isDefault: index === 0,
    }))
}


function resolveVideo(
  override: string | undefined,
  detected: string[],
  warnings: string[],
): string | undefined {
  if (override !== undefined) {
    if (detected.includes(override)) return override
    warnings.push(`movie.toml points to a missing video file: ${override}`)
  }
  return detected.slice().sort()[0]
}

function resolvePoster(
  override: string | undefined,
  detected: string[],
  warnings: string[],
): string | undefined {
  if (override !== undefined) {
    if (detected.includes(override)) return override
    warnings.push(`movie.toml points to a missing poster file: ${override}`)
  }
  return pickPosterFile(detected)
}

function resolveSubtitles(
  declared: SubtitleTrack[] | undefined,
  detected: string[],
  warnings: string[],
): SubtitleTrack[] {
  if (declared !== undefined && declared.length > 0) {
    const existing = declared.filter((track) => {
      const present = detected.includes(track.fileName)
      if (!present) {
        warnings.push(`movie.toml points to a missing subtitle file: ${track.fileName}`)
      }
      return present
    })
    if (existing.length > 0) return existing
  }
  return detectSubtitles(detected)
}

function describeTomlError(error: unknown): string {
  return error instanceof Error
    ? `Could not read movie.toml: ${error.message}`
    : 'Could not read movie.toml.'
}

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function asInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) ? value : undefined
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const items = value
    .map((entry) => asNonEmptyString(entry))
    .filter((entry): entry is string => entry !== undefined)
  return items.length > 0 ? items : undefined
}

function asSubtitleList(value: unknown): SubtitleTrack[] | undefined {
  if (!Array.isArray(value)) return undefined
  const tracks: SubtitleTrack[] = []

  for (const entry of value) {
    if (typeof entry !== 'object' || entry === null) continue
    const record = entry as Record<string, unknown>
    const fileName = asNonEmptyString(record.file)
    if (fileName === undefined) continue
    tracks.push({
      fileName,
      label: asNonEmptyString(record.label) ?? subtitleLabelFromFileName(fileName),
      isDefault: record.default === true,
    })
  }

  return tracks.length > 0 ? tracks : undefined
}

