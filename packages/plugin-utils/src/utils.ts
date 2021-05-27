import { toArray } from '@antfu/utils'

export type { Arrayable } from '@antfu/utils'
export { toArray, partition, slash } from '@antfu/utils'

export type NestedArrayable<T> = T | (T | T[])[]

export function flattenArray<T>(v: NestedArrayable<T>): T[] {
  return toArray(v).flat() as T[]
}

export function mergeArrays<T>(...args: (NestedArrayable<T> | undefined)[]): T[] {
  return args.flatMap(i => flattenArray(i || []))
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

export function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}
