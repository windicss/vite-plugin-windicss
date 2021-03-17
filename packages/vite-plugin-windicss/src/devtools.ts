import fs from 'fs'
import { resolve } from 'path'
import { Plugin, ResolvedConfig } from 'vite'
import { json } from 'body-parser'
import { WindiPluginUtils } from '@windicss/plugin-utils'
import _debug from 'debug'
import { MODULE_ID_VIRTUAL, NAME } from './constants'

const debug = {
  devtools: _debug(`${NAME}:devtools`),
}

const DEVTOOLS_MODULE_ID = 'virtual:windi-devtools'
const POST_PATH = '/@windicss-devtools-update'

export function createDevtoolsPlugin(ctx: { utils: WindiPluginUtils }): Plugin[] {
  let config: ResolvedConfig

  const clientCode = fs
    .readFileSync(resolve(__dirname, 'client/index.mjs'), 'utf-8')
    .replace('__POST_PATH__', POST_PATH)

  return [
    {
      name: `${NAME}:devtools`,

      configResolved(_config) {
        config = _config
      },

      configureServer(server) {
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
        return id === DEVTOOLS_MODULE_ID
          ? DEVTOOLS_MODULE_ID
          : null
      },

      async load(id) {
        if (id === DEVTOOLS_MODULE_ID)
          return config.command === 'build' ? '' : clientCode
      },
    }]
}
