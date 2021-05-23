import type { ExtractorResultDetailed } from 'windicss/types/interfaces'
import { regexQuotedString, regexClassSplitter, validClassName, regexHtmlTag, regexAttributifyItem } from '../regexes'

// declare module 'windicss/types/interfaces' {
//   export interface ExtractorResultDetailed {
//     attributes?: {
//       names: string[]
//       values: string[]
//       classes?: string[]
//     }
//   }
// }

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
      const attrRanges: [number, number][] = []
      const attributes: ExtractorResultDetailed['attributes'] = {
        names: [],
        values: [],
      }

      const blocks = ['class', 'className']

      tags.forEach((i) => {
        return Array.from(i[2].matchAll(regexAttributifyItem) || [])
          .forEach((match) => {
            const [full, name,, value] = match
            if (blocks.includes(name))
              return
            attributes.names.push(name)
            attributes.values.push(value)
            if (match.index != null)
              attrRanges.push([match.index, match.index + full.length])
          })
      })

      // Disable this feature for now as we need to find a way to avoid false-negative
      //
      // attributes.classes = Array.from(code.matchAll(regexQuotedString))
      //   .flatMap((m) => {
      //     if (m.index != null && attrRanges.some(([start, end]) => m.index! >= start && m.index! <= end))
      //       return []
      //     return (m[2] || '').split(regexClassSplitter)
      //   })
      //   .filter(validClassName)

      return attributes
    },
  }
}
