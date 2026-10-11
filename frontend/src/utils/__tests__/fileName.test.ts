import { describe, expect, it } from 'vitest'
import { parseFolderName, stripExtension, subtitleLabelFromFileName } from '../fileName'

describe('stripExtension', () => {
  it('removes the extension', () => {
    expect(stripExtension('movie.toml')).toBe('movie')
  })

  it('returns the name unchanged when there is no extension', () => {
    expect(stripExtension('noext')).toBe('noext')
  })

  it('keeps dotfiles intact', () => {
    expect(stripExtension('.gitignore')).toBe('.gitignore')
  })
})

describe('parseFolderName', () => {
  it('extracts a bracketed year', () => {
    expect(parseFolderName('Blade Runner (1982)')).toEqual({
      title: 'Blade Runner',
      year: 1982,
    })
  })

  it('converts separators and extracts a trailing year', () => {
    expect(parseFolderName('The.Matrix.1999')).toEqual({
      title: 'The Matrix',
      year: 1999,
    })
  })

  it('keeps a leading year that is part of the title', () => {
    expect(parseFolderName('2001 A Space Odyssey')).toEqual({
      title: '2001 A Space Odyssey',
    })
  })

  it('handles square-bracket years', () => {
    expect(parseFolderName('Blade_Runner_[1982]')).toEqual({
      title: 'Blade Runner',
      year: 1982,
    })
  })

  it('falls back to the raw name when the title would be empty', () => {
    expect(parseFolderName('1984')).toEqual({ title: '1984', year: 1984 })
  })
})

describe('subtitleLabelFromFileName', () => {
  it('maps a trailing two-letter language code', () => {
    expect(subtitleLabelFromFileName('Blade Runner.en.srt')).toBe('English')
  })

  it('maps a trailing three-letter language code', () => {
    expect(subtitleLabelFromFileName('movie.eng.srt')).toBe('English')
  })

  it('falls back to the base name when there is no language code', () => {
    expect(subtitleLabelFromFileName('subs.srt')).toBe('subs')
    expect(subtitleLabelFromFileName('Blade Runner.srt')).toBe('Blade Runner')
  })
})
