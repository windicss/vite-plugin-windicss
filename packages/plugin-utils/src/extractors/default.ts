import type { ExtractorResultDetailed } from 'windicss/types/interfaces'
import { regexQuotedString, regexClassSplitter, validClassName, regexHtmlTag, regexAttributifyItem } from '../regexes'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DefaultExtractor(code: string, id?: string): ExtractorResultDetailed {
  if (id?.endsWith('.css') || id?.endsWith('.postcss')) {
    return {
      classes: [],
      tags: [],
    }
  }

  const tags = Array.from(code.matchAll(regexHtmlTag))
  const tagNames = tags.map(i => i[1])

  return {
    tags: tagNames,
    get classes() {
      return Array.from(code.matchAll(regexQuotedString))
        .flatMap(m => (m[2] || '').split(regexClassSplitter))
        .filter(validClassName)
    },
    get attributes() {
      const attributes: ExtractorResultDetailed['attributes'] = {
        names: [],
        values: [],
      }

      tags.forEach((i) => {
        return Array.from(i[2].matchAll(regexAttributifyItem) || [])
          .forEach(([, name,, value]) => {
            attributes.names.push(name)
            attributes.values.push(value)
          })
      })

      return attributes
    },
  }
}
