import { regexClassGroup } from './constants'

export function toArray<T>(v: T | T[]): T[] {
  if (Array.isArray(v))
    return v
  return [v]
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

export function transfromGroups(str: string) {
  return str.replace(
    regexClassGroup,
    (_, a: string, b: string) => b.split(/\s/g).map(i => `${a}:${i}`).join(' '),
  )
}
