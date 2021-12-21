import type { FullConfig } from 'windicss/types/interfaces'

const isObject = (val: any) => toString.call(val) === '[object Object]'

function deepMerge(a: any, b: any, rootPath: string) {
  a = { ...a }
  Object.keys(b).forEach((key) => {
    if (isObject(a[key]))
      a[key] = deepMerge(a[key], b[key], rootPath ? `${rootPath}.${key}` : key)
    else if (Array.isArray(a[key]))
      a[key] = [...a[key], ...b[key]]
    else
      a[key] = b[key]
  })
  return a
}

export function mergeWindicssConfig(a: FullConfig, b: FullConfig) {
  // TODO: handle more special props
  return deepMerge(a, b, '')
}
