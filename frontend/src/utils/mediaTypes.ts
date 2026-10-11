const VIDEO_EXTENSIONS = new Set([
  'mp4',
  'm4v',
  'webm',
  'mkv',
  'mov',
  'avi',
  'ogv',
  'ogg',
])

const SUBTITLE_EXTENSIONS = new Set(['srt', 'vtt', 'ass', 'ssa', 'sub'])

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp'])

/** Lower-cased extension of a file name, without the leading dot. */
export function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : ''
}

export function isVideoFile(fileName: string): boolean {
  return VIDEO_EXTENSIONS.has(getExtension(fileName))
}

export function isSubtitleFile(fileName: string): boolean {
  return SUBTITLE_EXTENSIONS.has(getExtension(fileName))
}

export function isImageFile(fileName: string): boolean {
  return IMAGE_EXTENSIONS.has(getExtension(fileName))
}
