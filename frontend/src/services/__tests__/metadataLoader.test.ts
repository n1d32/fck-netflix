import { describe, expect, it } from 'vitest'
import {
  createMovieFromFolder,
  detectSubtitles,
  parseMovieToml,
  pickPosterFile,
  type MovieFolderScan,
} from '../metadataLoader'

const TOML = `
title = "Blade Runner"
year = 1982
genres = ["Sci-Fi", "Thriller"]
description = "A blade runner must pursue and terminate four replicants."

video = "blade.mp4"
poster = "poster.jpg"

subtitles = [
  { file = "blade.es.srt", label = "Español" },
  { file = "blade.en.srt", label = "English", default = true },
]
`

const SCAN: MovieFolderScan = {
  folderName: 'Blade Runner',
  videoFiles: ['blade.mp4'],
  subtitleFiles: ['blade.en.srt', 'blade.es.srt'],
  posterFiles: ['poster.jpg'],
}

describe('parseMovieToml', () => {
  it('reads every supported field', () => {
    expect(parseMovieToml(TOML)).toEqual({
      title: 'Blade Runner',
      year: 1982,
      genres: ['Sci-Fi', 'Thriller'],
      description: 'A blade runner must pursue and terminate four replicants.',
      videoFileName: 'blade.mp4',
      posterFileName: 'poster.jpg',
      subtitles: [
        { fileName: 'blade.es.srt', label: 'Español', isDefault: false },
        { fileName: 'blade.en.srt', label: 'English', isDefault: true },
      ],
    })
  })

  it('ignores fields with the wrong type', () => {
    expect(parseMovieToml('year = "1982"\ngenres = "Action"')).toEqual({})
  })

  it('throws when the TOML is malformed', () => {
    expect(() => parseMovieToml('title = ')).toThrow()
  })
})

describe('createMovieFromFolder', () => {
  it('falls back to the folder name and detected files', () => {
    const movie = createMovieFromFolder(SCAN)

    expect(movie).toMatchObject({
      id: 'Blade Runner',
      title: 'Blade Runner',
      genres: [],
      videoFileName: 'blade.mp4',
      posterFileName: 'poster.jpg',
      metadataSource: 'folder-name',
      warnings: [],
    })
    expect(movie.subtitles).toEqual([
      { fileName: 'blade.en.srt', label: 'English', isDefault: true },
      { fileName: 'blade.es.srt', label: 'Spanish', isDefault: false },
    ])
  })

  it('derives the title and year from the folder name', () => {
    const movie = createMovieFromFolder({ ...SCAN, folderName: 'Arrival (2016)' })
    expect(movie.title).toBe('Arrival')
    expect(movie.year).toBe(2016)
  })

  it('prefers movie.toml metadata when present', () => {
    const movie = createMovieFromFolder(SCAN, TOML)

    expect(movie.metadataSource).toBe('toml')
    expect(movie.title).toBe('Blade Runner')
    expect(movie.year).toBe(1982)
    expect(movie.genres).toEqual(['Sci-Fi', 'Thriller'])
    expect(movie.subtitles[1]).toEqual({
      fileName: 'blade.en.srt',
      label: 'English',
      isDefault: true,
    })
  })

  it('records a warning and falls back when the TOML is invalid', () => {
    const movie = createMovieFromFolder(SCAN, 'title = ')

    expect(movie.metadataSource).toBe('folder-name')
    expect(movie.title).toBe('Blade Runner')
    expect(movie.warnings).toHaveLength(1)
  })

  it('warns about overrides that point to missing files', () => {
    const movie = createMovieFromFolder(
      { ...SCAN, videoFiles: ['other.mp4'], posterFiles: [] },
      'video = "missing.mp4"\nposter = "missing.jpg"',
    )

    expect(movie.videoFileName).toBe('other.mp4')
    expect(movie.posterFileName).toBeUndefined()
    expect(movie.warnings).toHaveLength(2)
  })

  it('warns about declared subtitles that are missing', () => {
    const movie = createMovieFromFolder(
      { ...SCAN, subtitleFiles: [] },
      'subtitles = [{ file = "gone.srt" }]',
    )

    expect(movie.subtitles).toEqual([])
    expect(movie.warnings).toEqual([
      'movie.toml points to a missing subtitle file: gone.srt',
    ])
  })
})

describe('pickPosterFile', () => {
  it('prefers conventional poster names', () => {
    expect(pickPosterFile(['zzz.jpg', 'cover.png'])).toBe('cover.png')
    expect(pickPosterFile(['zzz.jpg', 'folder.webp'])).toBe('folder.webp')
  })

  it('otherwise returns the alphabetically first image', () => {
    expect(pickPosterFile(['b.png', 'a.jpg'])).toBe('a.jpg')
  })

  it('returns undefined when there are no images', () => {
    expect(pickPosterFile([])).toBeUndefined()
  })
})

describe('detectSubtitles', () => {
  it('sorts tracks and marks the first as default', () => {
    expect(detectSubtitles(['b.es.srt', 'b.en.srt'])).toEqual([
      { fileName: 'b.en.srt', label: 'English', isDefault: true },
      { fileName: 'b.es.srt', label: 'Spanish', isDefault: false },
    ])
  })
})
