import MagicString from 'magic-string'
import { escapeRegExp } from './utils'
import { regexClassGroup } from './regexes'

export interface TransformerOptions {
  include?: RegExp[]
}

export type TransformerFunction = (code: string, id: string) => string | undefined | null

export type Transformer<T extends TransformerOptions> = (options?: T) => TransformerFunction

export function transformGroups(code: string, sourcemap = true) {
  const s = new MagicString(code)
  let hasReplaced = false
  let match

  regexClassGroup.lastIndex = 0
  // eslint-disable-next-line no-cond-assign
  while ((match = regexClassGroup.exec(code))) {
    hasReplaced = true
    const start = match.index
    const end = start + match[0].length
    const a = match[1]
    const b = match[2]
    const replacement = b.split(/\s/g).map(i => `${a}:${i}`).join(' ')
    s.overwrite(start, end, replacement)
  }

  if (!hasReplaced)
    return null

  return {
    code: s.toString(),
    map: sourcemap ? s.generateMap({ hires: true }) : undefined,
  }
}

export function buildAliasTransformer(alias?: Record<string, string>) {
  if (!alias || !Object.keys(alias).length)
    return () => null

  const keys = Object.keys(alias).sort((a, b) => b.length - a.length).map(i => escapeRegExp(i)).join('|')
  const regexText = `\\*(?:${keys})(?<=[^\w-])`
  const regex = new RegExp(regexText, 'g')
  console.dir(regex)

  return function transformAlias(code: string, sourcemap = true) {
    const s = new MagicString(code)
    let hasReplaced = false
    let match

    console.log(code)

    regex.lastIndex = 0
    // eslint-disable-next-line no-cond-assign
    while ((match = regex.exec(code))) {
      hasReplaced = true
      const start = match.index
      const end = start + match[0].length
      const name = code.slice(start + 1, end)
      console.log('matched!!!', name)
      const replacement = alias[name]
      s.overwrite(start, end, replacement)
    }

    if (!hasReplaced)
      return null

    return {
      code: s.toString(),
      map: sourcemap ? s.generateMap({ hires: true }) : undefined,
    }
  }
}
