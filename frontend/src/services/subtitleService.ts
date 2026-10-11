import { getExtension } from '../utils/mediaTypes'

const VTT_HEADER = 'WEBVTT\n\n'

/**
 * Convert SubRip (SRT) content to WebVTT.
 *
 * Browsers only accept WebVTT in `<track>` elements, so SRT files must be
 * converted before they can be displayed.
 */
export function convertSrtToVtt(srt: string): string {
  const normalized = srt.replace(/\r\n?/g, '\n').trim()
  if (normalized.length === 0) return VTT_HEADER

  const cues = normalized
    .split(/\n{2,}/)
    .map(convertSrtBlock)
    .filter((cue): cue is string => cue !== null)

  if (cues.length === 0) return VTT_HEADER
  return `${VTT_HEADER}${cues.join('\n\n')}\n`
}

/** Convert subtitle content to WebVTT, leaving already-VTT content intact. */
export function toVtt(content: string, fileName: string): string {
  return getExtension(fileName) === 'vtt' ? content : convertSrtToVtt(content)
}

/** Object URL for subtitle content, ready to be used as a `<track>` source. */
export function createVttBlobUrl(content: string, fileName: string): string {
  const blob = new Blob([toVtt(content, fileName)], { type: 'text/vtt' })
  return URL.createObjectURL(blob)
}

function convertSrtBlock(block: string): string | null {
  const lines = block.split('\n')
  const timeLineIndex = lines.findIndex((line) => line.includes('-->'))
  if (timeLineIndex === -1) return null

  // SRT uses a comma before the milliseconds; WebVTT uses a period.
  const timeLine = lines[timeLineIndex]!.replace(/,/g, '.')
  const text = lines.slice(timeLineIndex + 1).join('\n')
  return `${timeLine}\n${text}`
}
