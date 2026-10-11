import { describe, expect, it } from 'vitest'
import {
  getExtension,
  isImageFile,
  isSubtitleFile,
  isVideoFile,
} from '../mediaTypes'

describe('getExtension', () => {
  it('returns the lower-cased extension', () => {
    expect(getExtension('Movie.MP4')).toBe('mp4')
  })

  it('handles multi-dot names', () => {
    expect(getExtension('archive.tar.gz')).toBe('gz')
  })

  it('returns an empty string when there is no extension', () => {
    expect(getExtension('noext')).toBe('')
  })

  it('treats dotfiles as having no extension', () => {
    expect(getExtension('.gitignore')).toBe('')
  })
})

describe('media type predicates', () => {
  it('detects video files', () => {
    expect(isVideoFile('film.mkv')).toBe(true)
    expect(isVideoFile('film.MP4')).toBe(true)
    expect(isVideoFile('film.srt')).toBe(false)
  })

  it('detects subtitle files', () => {
    expect(isSubtitleFile('film.en.SRT')).toBe(true)
    expect(isSubtitleFile('film.vtt')).toBe(true)
    expect(isSubtitleFile('film.mp4')).toBe(false)
  })

  it('detects image files', () => {
    expect(isImageFile('poster.jpg')).toBe(true)
    expect(isImageFile('cover.WEBP')).toBe(true)
    expect(isImageFile('film.mp4')).toBe(false)
  })
})
