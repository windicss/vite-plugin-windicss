function post(data: any) {
  return fetch('__POST_PATH__', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}

if (import.meta.hot) {
  console.warn('[windicss] windicss devtools enabled')

  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        const classes = Array.from((mutation.target as any).classList || [])
        if (classes.length)
          post({ type: 'add-classes', data: classes })
      }
    })
  })

  mutationObserver.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true,
    attributes: true,
  })
}
