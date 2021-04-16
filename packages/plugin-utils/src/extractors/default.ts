import type { ExtractorResultDetailed } from 'windicss/types/interfaces'
import { regexQuotedString, regexClassSplitter, validClassName, regexHtmlTag } from '../regexes'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DefaultExtractor(code: string, id?: string): ExtractorResultDetailed {
  if (id?.endsWith('.css') || id?.endsWith('.postcss')) {
    return {
      classes: [],
      tags: [],
    }
  }

  const classes = Array.from(code.matchAll(regexQuotedString))
    .flatMap(m => (m[2] || '').split(regexClassSplitter))
    .filter(validClassName)

  const tags = Array.from(code.matchAll(regexHtmlTag))
    .map(i => i[1])

  return {
    classes,
    tags,
  }
}
