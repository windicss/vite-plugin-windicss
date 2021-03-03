import MagicString from 'magic-string'
import { regexClassGroup } from './regexes'

export function toArray<T>(v: T | T[]): T[] {
  if (Array.isArray(v))
    return v
  return [v]
}

export function slash(str: string) {
  return str.replace(/\\/g, '/')
}

export function kebabCase(str: string) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

export function include<T>(set: Set<T>, v: T[] | Set<T>) {
  for (const i of v)
    set.add(i)
}

export function exclude<T>(set: Set<T>, v: T[] | Set<T>) {
  for (const i of v)
    set.delete(i)
}

export function transformGroups(str: string) {
  return str.replace(
    regexClassGroup,
    (_, a: string, b: string) => b.split(/\s/g).map(i => `${a}:${i}`).join(' '),
  )
}

export function transformGroupsWithSourcemap(code: string) {
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
    map: s.generateMap({ hires: true }),
  }
}
