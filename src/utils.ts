
export function toArray<T>(v: T | T[]): T[] {
  if (Array.isArray(v))
    return v
  return [v]
}

export function pascalCase(str: string) {
  const camelStr = camelCase(str)
  return camelStr.charAt(0).toUpperCase() + camelStr.slice(1)
}

export function camelCase(str: string) {
  return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''))
}

export function add<T>(set: Set<T>, v: T[] | Set<T>) {
  for (const i of v)
    set.add(i)
}

export function remove<T>(set: Set<T>, v: T[] | Set<T>) {
  for (const i of v)
    set.delete(i)
}
