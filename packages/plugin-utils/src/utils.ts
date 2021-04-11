import MagicString from 'magic-string'
import { regexClassGroup } from './regexes'

export type Arrayable<T> = T | T[]
export type NestedArrayable<T> = T | (T | T[])[]

export function toArray<T>(v: Arrayable<T>): T[] {
  if (Array.isArray(v))
    return v
  return [v]
}

export function flattenArray<T>(v: NestedArrayable<T>): T[] {
  return toArray(v).flat() as T[]
}

export function mergeArrays<T>(...args: (NestedArrayable<T> | undefined)[]): T[] {
  return args.flatMap(i => flattenArray(i || []))
}

export function slash(str: string) {
  return str.replace(/\\/g, '/')
}

export function kebabCase(str: string) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

export function partition<T>(array: T[], filter: (i: T, idx: number, arr: T[]) => any) {
  const pass: T[] = []; const fail: T[] = []
  array.forEach((e, idx, arr) => (filter(e, idx, arr) ? pass : fail).push(e))
  return [pass, fail]
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
