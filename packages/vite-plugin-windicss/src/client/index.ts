// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../node_modules/vite/client.d.ts" />

function post(data: any) {
  return fetch('__POST_PATH__', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}

export function include<T>(set: Set<T>, v: T[] | Set<T>) {
  for (const i of v)
    set.add(i)
}

export function exclude<T>(set: Set<T>, v: T[] | Set<T>) {
  for (const i of v)
    set.delete(i)
}

console.log(
  '%c[windicss] devtools support enabled %c\nread more at https://windicss.org',
  'background:#0ea5e9; color:white; padding: 1px 4px; border-radius: 3px;',
  '',
)

const visitedClasses = new Set()
const pendingClasses = new Set()

let _timer: number | undefined

function schedule() {
  if (_timer != null)
    clearTimeout(_timer)
  _timer = setTimeout(() => {
    if (pendingClasses.size) {
      post({ type: 'add-classes', data: Array.from(pendingClasses) })
      include(visitedClasses, pendingClasses)
      pendingClasses.clear()
    }
  }, 10) as any
}

const mutationObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'class') {
      console.log(mutation)
      Array.from((mutation.target as any).classList || [])
        .forEach((i) => {
          if (!visitedClasses.has(i))
            pendingClasses.add(i)
        })
      schedule()
    }
  })
})

mutationObserver.observe(document.documentElement || document.body, {
  childList: true,
  subtree: true,
  attributes: true,
})
