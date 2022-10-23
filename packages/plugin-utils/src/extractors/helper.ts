import { extname } from 'path'
import { uniq } from '@antfu/utils'
import type { Extractor, ExtractorResultDetailed } from 'windicss/types/interfaces'
import { DefaultExtractor } from './default'
import { PugExtractor } from './pug'
import { SvelteExtractor } from './svelte'

export function getDefaultExtractors() {
  const extractors: Extractor[] = [
    {
      extractor: SvelteExtractor,
      extensions: ['svelte'],
    },
  ]

  // auto detect pug
  try {
    require.resolve('pug')
    extractors.push({
      extractor: PugExtractor,
      extensions: ['vue', 'pug'],
    })
  }
  catch (e) {}

  return extractors
}

export async function applyExtractors(code: string, id?: string, extractors: Extractor[] = [], defaultExtract = DefaultExtractor) {
  let ext = id ? extname(id) : '*'
  if (ext[0] === '.')
    ext = ext.slice(1)

  const matchingExtractors = extractors
    .filter(extractor => extractor.extensions.includes(ext))
    .map(extractor => extractor.extractor)
  return Promise.all((matchingExtractors.length ? matchingExtractors : [defaultExtract])
    .map(extractor => extractor(code, id)))
    .then((results) => {
      const attributesNames = results.flatMap(v => v.attributes?.names ?? [])
      const attributesValues = results.flatMap(v => v.attributes?.values ?? [])
      return {
        tags: uniq(results.flatMap(v => v.tags ?? [])),
        ids: uniq(results.flatMap(v => v.ids ?? [])),
        classes: uniq(results.flatMap(v => v.classes ?? [])),
        attributes: (attributesNames.length || attributesValues.length)
          ? {
              names: attributesNames,
              values: attributesValues,
            }
          : undefined,
      } as ExtractorResultDetailed
    })
}
