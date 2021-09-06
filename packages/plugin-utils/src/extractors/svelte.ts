import type { ExtractorResultDetailed } from 'windicss/types/interfaces'
import { regexSvelteClass } from '../regexes'
import { DefaultExtractor } from './default'

export function SvelteExtractor(code: string, id?: string): ExtractorResultDetailed {
  const result = DefaultExtractor(code, id)

  return {
    tags: result.tags,
    get classes() {
      return [
        ...result.classes!,
        ...Array.from(code.matchAll(regexSvelteClass)).map(i => i[1]).filter(Boolean),
      ]
    },
    get attributes() {
      return result.attributes
    },
  }
}
