import { extname } from 'path'
import type { Extractor } from 'windicss/types/interfaces'
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
    require('pug')
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
  for (const { extractor, extensions } of extractors) {
    if (extensions.includes(ext))
      return extractor(code, id)
  }
  return defaultExtract(code, id)
}
