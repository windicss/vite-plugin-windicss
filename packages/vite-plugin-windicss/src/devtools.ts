import fs from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import type { WindiPluginUtils } from '@windicss/plugin-utils'
import type { IncomingMessage } from 'connect'
import _debug from 'debug'
import { NAME } from './constants'
import { getChangedModuleNames, getCssModules, invalidateCssModules, sendHmrReload } from './modules'

const _dirname = typeof __dirname !== 'undefined'
  ? __dirname
  : dirname(fileURLToPath(import.meta.url))

const debug = {
  devtools: _debug(`${NAME}:devtools`),
}

const DEVTOOLS_MODULE_ID = 'virtual:windi-devtools'
const MOCK_CLASSES_MODULE_ID = 'virtual:windi-mock-classes'
const MOCK_CLASSES_PATH = '/@windicss/mock-classes'
const DEVTOOLS_PATH = '/@windicss/devtools'

const MODULES_MAP: Record<string, string | undefined> = {
  [DEVTOOLS_MODULE_ID]: DEVTOOLS_PATH,
  [MOCK_CLASSES_MODULE_ID]: MOCK_CLASSES_PATH,
}
const POST_PATH = '/@windicss-devtools-update'

function getBodyJson(req: IncomingMessage) {
  return new Promise<any>((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('error', reject)
    req.on('end', () => {
      try {
        resolve(JSON.parse(body) || {})
      }
      catch (e) {
        reject(e)
      }
    })
  })
}

export function createDevtoolsPlugin(ctx: { utils: WindiPluginUtils }): Plugin[] {
  let config: ResolvedConfig
  let server: ViteDevServer | undefined
  let clientCode = ''

  function updateCSS() {
    if (!server)
      return

    const names = getChangedModuleNames(ctx.utils)
    const modules = getCssModules(server, names)
    invalidateCssModules(server, modules)
    sendHmrReload(server, modules)
  }

  function toClass(name: string) {
    // css escape
    return `.${ctx.utils.processor.e(name)}{}`
  }

  function getMockClassesInjector() {
    const completions = ctx.utils.getCompletions()
    const comment = '/* Windi CSS mock class names for devtools auto-completion */\n'
    const css = [
      ...completions.color,
      ...completions.static,
    ].map(toClass).join('')
    return `
const style = document.createElement('style')
style.setAttribute('type', 'text/css')
style.innerHTML = ${JSON.stringify(comment + css)}
document.head.prepend(style)
`
  }

  return [
    {
      name: `${NAME}:devtools`,

      configResolved(_config) {
        config = _config
      },

      configureServer(_server) {
        server = _server

        server.middlewares.use(async(req, res, next) => {
          if (req.url !== POST_PATH)
            return next()

          try {
            const data = await getBodyJson(req)
            const type = data?.type
            debug.devtools(data)
            let changed = false
            switch (type) {
              case 'add-classes':
                changed = ctx.utils.addClasses(data.data || [])
            }
            if (changed)
              updateCSS()
            res.statusCode = 200
          }
          catch (e) {
            console.error(e)
            res.statusCode = 500
          }

          res.end()
        })
      },

      resolveId(id) {
        return MODULES_MAP[id]
      },

      async load(id, options) {
        if (options?.ssr && [DEVTOOLS_PATH, MOCK_CLASSES_PATH].includes(id))
          return ''

        if (id === DEVTOOLS_PATH) {
          if (!clientCode) {
            clientCode = [
              await fs.promises.readFile(resolve(_dirname, 'client.mjs'), 'utf-8'),
              `import('${MOCK_CLASSES_MODULE_ID}')`,
            ]
              .join('\n')
              .replace('__POST_PATH__', (config.server?.origin ?? '') + POST_PATH)
          }
          return config.command === 'build'
            ? ''
            : clientCode
        }
        else if (id === MOCK_CLASSES_PATH) {
          return getMockClassesInjector()
        }
      },
    }]
}
