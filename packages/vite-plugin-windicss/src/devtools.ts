import fs from 'fs'
import { resolve } from 'path'
import { Plugin, ResolvedConfig } from 'vite'
import { json } from 'body-parser'
import { WindiPluginUtils } from '@windicss/plugin-utils'
import _debug from 'debug'
import { MODULE_ID_VIRTUAL, NAME } from './constants'
import { cssEscape } from './utils'

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

function toClass(name: string) {
  return `.${cssEscape(name)}{}`
}

export function createDevtoolsPlugin(ctx: { utils: WindiPluginUtils }): Plugin[] {
  let config: ResolvedConfig

  let clientCode = ''
  return [
    {
      name: `${NAME}:devtools`,

      configResolved(_config) {
        config = _config
      },

      configureServer(server) {
        clientCode = [
          fs
            .readFileSync(resolve(__dirname, 'client.mjs'), 'utf-8')
            .replace('__POST_PATH__', POST_PATH),
          `import('${MOCK_CLASSES_MODULE_ID}')`,
        ].join('\n')

        function updateCSS() {
          const module = server.moduleGraph.getModuleById(MODULE_ID_VIRTUAL)
          if (module)
            server.moduleGraph.invalidateModule(module)
          server.ws.send({
            type: 'update',
            updates: [{
              acceptedPath: MODULE_ID_VIRTUAL,
              path: MODULE_ID_VIRTUAL,
              timestamp: +Date.now(),
              type: 'js-update',
            }],
          })
        }

        server.middlewares.use(json())
        server.middlewares.use((req, res, next) => {
          if (req.url === POST_PATH) {
            // @ts-expect-error
            const data = req.body || {}
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
            res.write('')
            return
          }

          next()
        })
      },

      resolveId(id) {
        return MODULES_MAP[id]
      },

      async load(id) {
        if (id === MOCK_CLASSES_PATH) {
          const completions = ctx.utils.getCompletions()
          const comment = '/* Windi CSS mock class names for devtools auto-completeion */ '
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
        else if (id === DEVTOOLS_PATH) {
          return config.command === 'build'
            ? ''
            : clientCode
        }
      },
    }]
}
