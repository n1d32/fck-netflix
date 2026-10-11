/** Common ISO 639-1/639-2 language codes mapped to readable names. */
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  eng: 'English',
  es: 'Spanish',
  spa: 'Spanish',
  fr: 'French',
  fra: 'French',
  fre: 'French',
  de: 'German',
  deu: 'German',
  ger: 'German',
  it: 'Italian',
  ita: 'Italian',
  pt: 'Portuguese',
  por: 'Portuguese',
  nl: 'Dutch',
  nld: 'Dutch',
  pl: 'Polish',
  pol: 'Polish',
  ru: 'Russian',
  rus: 'Russian',
  ja: 'Japanese',
  jpn: 'Japanese',
  ko: 'Korean',
  kor: 'Korean',
  zh: 'Chinese',
  zho: 'Chinese',
  chi: 'Chinese',
  ar: 'Arabic',
  ara: 'Arabic',
  sv: 'Swedish',
  swe: 'Swedish',
  da: 'Danish',
  dan: 'Danish',
  fi: 'Finnish',
  fin: 'Finnish',
  no: 'Norwegian',
  nor: 'Norwegian',
  tr: 'Turkish',
  tur: 'Turkish',
  cs: 'Czech',
  ces: 'Czech',
  el: 'Greek',
  ell: 'Greek',
  he: 'Hebrew',
  heb: 'Hebrew',
  hi: 'Hindi',
  hin: 'Hindi',
}

const SEPARATOR_PATTERN = /[._]+/g
const BRACKETED_YEAR_PATTERN = /[(\[]\s*((?:19|20)\d{2})\s*[)\]]/
const TRAILING_YEAR_PATTERN = /(?:^|\s)((?:19|20)\d{2})\s*$/

function collapseSpaces(value: string): string {
  return value.replace(/\s{2,}/g, ' ').trim()
}

/** File name without its extension (the whole name when there is none). */
export function stripExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot > 0 ? fileName.slice(0, dot) : fileName
}

/**
 * Derive a display title and, when present, a year from a folder or file name.
 *
 * Handles common separators (`_`, `.`) and bracketed or trailing years, e.g.
 * `"Blade.Runner.(1982)"` → `{ title: "Blade Runner", year: 1982 }`.
 */
export function parseFolderName(folderName: string): { title: string; year?: number } {
  const normalized = collapseSpaces(folderName.replace(SEPARATOR_PATTERN, ' '))

  const bracketed = normalized.match(BRACKETED_YEAR_PATTERN)
  if (bracketed) {
    return {
      title: collapseSpaces(normalized.replace(bracketed[0], ' ')) || folderName,
      year: Number.parseInt(bracketed[1]!, 10),
    }
  }

  const trailing = normalized.match(TRAILING_YEAR_PATTERN)
  if (trailing) {
    const end = trailing.index ?? normalized.length
    return {
      title: collapseSpaces(normalized.slice(0, end)) || folderName,
      year: Number.parseInt(trailing[1]!, 10),
    }
  }

  return { title: normalized || folderName }
}

/**
 * Build a readable subtitle label from a file name, recognising a trailing
 * language code (e.g. `"Movie.en.srt"` → `"English"`).
 */
export function subtitleLabelFromFileName(fileName: string): string {
  const base = stripExtension(fileName)
  const segments = base.split(/[.\-_ ]+/).filter(Boolean)
  const last = segments.at(-1)

  if (last !== undefined && /^[a-z]{2,3}$/i.test(last)) {
    const code = last.toLowerCase()
    return LANGUAGE_NAMES[code] ?? code.toUpperCase()
  }

  return base
}
