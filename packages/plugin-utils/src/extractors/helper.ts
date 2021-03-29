import { extname } from 'path'
import { Extractor } from 'windicss/types/interfaces'
import { DefaultExtractor } from './default'
import { PugExtractor } from './pug'

export function getDefaultExtractors() {
  const extractors: Extractor[] = []

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
  for (const { extractor, extensions } of extractors) {
    if (extensions.includes(ext))
      return extractor(code, id)
  }
  return defaultExtract(code, id)
}
