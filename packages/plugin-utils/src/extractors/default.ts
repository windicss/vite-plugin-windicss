import type { ExtractorResultDetailed } from 'windicss/types/interfaces'
import { regexAttributifyItem, regexClassSplitter, regexHtmlTag, validClassName } from '../regexes'

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
      return code
        .split(regexClassSplitter)
        .filter(validClassName)
    },
    get attributes() {
      const attrRanges: [number, number][] = []
      const attributes: ExtractorResultDetailed['attributes'] = {
        names: [],
        values: [],
      }

      const attributesBlocklist = ['class', 'className']
      const tagsBlocklist = ['meta', 'script', 'style', 'link']

      tags
        .filter(i => !tagsBlocklist.includes(i[1]))
        .forEach((i) => {
          return Array.from(i[2].matchAll(regexAttributifyItem) || [])
            .forEach((match) => {
              let name = match[1]
              const [full,,, value] = match
              // remove vue binding
              name = name.replace(/^(:|v-bind:)/, '')
              if (attributesBlocklist.includes(name))
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
