import { describe, expect, it } from 'vitest'
import { convertSrtToVtt, toVtt } from '../subtitleService'

const SRT = [
  '1',
  '00:00:01,000 --> 00:00:04,000',
  'Hello there',
  '',
  '2',
  '00:00:05,500 --> 00:00:07,000',
  'General Kenobi',
].join('\n')

describe('convertSrtToVtt', () => {
  it('converts cues and milliseconds separators', () => {
    expect(convertSrtToVtt(SRT)).toBe(
      [
        'WEBVTT',
        '',
        '00:00:01.000 --> 00:00:04.000',
        'Hello there',
        '',
        '00:00:05.500 --> 00:00:07.000',
        'General Kenobi',
        '',
      ].join('\n'),
    )
  })

  it('normalises CRLF line endings', () => {
    const crlf = SRT.replace(/\n/g, '\r\n')
    expect(convertSrtToVtt(crlf)).toContain('00:00:01.000 --> 00:00:04.000')
  })

  it('drops sequence numbers and keeps multi-line cues', () => {
    const multiline = ['1', '00:00:01,000 --> 00:00:02,000', 'line one', 'line two'].join('\n')
    expect(convertSrtToVtt(multiline)).toBe(
      ['WEBVTT', '', '00:00:01.000 --> 00:00:02.000', 'line one', 'line two', ''].join('\n'),
    )
  })

  it('returns a bare header for empty input', () => {
    expect(convertSrtToVtt('   \n  ')).toBe('WEBVTT\n\n')
  })

  it('returns a bare header when no cue timings are found', () => {
    expect(convertSrtToVtt('not a subtitle file')).toBe('WEBVTT\n\n')
  })
})

describe('toVtt', () => {
  it('converts SRT content', () => {
    expect(toVtt(SRT, 'movie.srt')).toContain('WEBVTT')
  })

  it('leaves existing WebVTT content untouched', () => {
    const vtt = 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nHi\n'
    expect(toVtt(vtt, 'movie.vtt')).toBe(vtt)
  })
})
