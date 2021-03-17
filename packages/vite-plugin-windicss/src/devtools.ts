import fs from 'fs'
import { resolve } from 'path'
import { Plugin, ResolvedConfig } from 'vite'
import { json } from 'body-parser'
import { include, WindiPluginUtils } from '@windicss/plugin-utils'
import { MODULE_ID_VIRTUAL } from './constants'

const NAME = 'vite-plugin-windicss'
const MODULE_ID = 'virtual:windi-devtools'
const POST_PATH = '/@windicss/post'

export function createDevtoolsPlugin(ctx: { utils: WindiPluginUtils }): Plugin[] {
  let config: ResolvedConfig

  const clientCode = fs
    .readFileSync(resolve(__dirname, 'client.mjs'), 'utf-8')
    .replace('__POST_PATH__', POST_PATH)
    .replace('var import_meta = {};', '')
    .replace('import_meta', 'import.meta')

  return [
    {
      name: `${NAME}:get-socket`,
      enforce: 'post',
      transform(code, id) {
        if (id.endsWith('vite/dist/client/client.js'))
          return code.replace('const hot = {', 'const hot = {\nget socket() { return socket },')
      },
    },
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
            console.log('Hi', req.url, data)
            switch (type) {
              case 'add-classes':
                include(ctx.utils.classesPending, (data.data || []))
            }
            updateCSS()
            res.statusCode = 200
            res.write('')
            return
          }

          next()
        })
      },

      resolveId(id) {
        return id === MODULE_ID
          ? MODULE_ID
          : null
      },

      async load(id) {
        if (id === MODULE_ID)
          return config.command === 'build' ? '' : clientCode
      },
    }]
}
