import { Plugin } from 'vite'
import _debug from 'debug'
import { UserOptions, WindiPluginUtils, resolveOptions, createUtils } from '@windicss/plugin-utils'

const NAME = 'vite-plugin-windicss'
const MODULE_ID = 'windi.css'
const MODULE_ID_VIRTUAL = `/@windicss/${MODULE_ID}`

const debug = {
  hmr: _debug(`${NAME}:hmr`),
  css: _debug(`${NAME}:transform:css`),
  group: _debug(`${NAME}:transform:group`),
}

function VitePluginWindicss(userOptions: UserOptions = {}): Plugin[] {
  let utils: WindiPluginUtils

  const options = resolveOptions(userOptions)
  const plugins: Plugin[] = []

  // Utilities grouping transform
  if (options.transformGroups) {
    plugins.push({
      name: `${NAME}:groups`,
      transform(code, id) {
        if (!utils.isDetectTarget(id))
          return
        debug.group(id)
        return utils.transfromGroups(code)
      },
    })
  }

  // CSS Entry via virtual module
  plugins.push({
    name: `${NAME}:entry`,
    enforce: 'post',

    configResolved(_config) {
      utils = createUtils(options, {
        name: NAME,
        root: _config.root,
      })
      utils.init()
    },

    resolveId(id): string | null {
      return id.startsWith(MODULE_ID) || id === MODULE_ID_VIRTUAL
        ? MODULE_ID_VIRTUAL
        : null
    },

    async load(id) {
      if (id === MODULE_ID_VIRTUAL)
        return await utils.generateCSS()
    },
  })

  // // Build
  // plugins.push({
  //   name: `${NAME}:build`,
  //   apply: 'build',
  //   enforce: 'post',
  //   transform(code, id) {
  //     utils.extractFile(code)
  //     return null
  //   },
  // })

  // HMR
  plugins.push({
    name: `${NAME}:hmr`,
    apply: 'serve',
    enforce: 'post',

    configureServer(server) {
      if (utils.configFilePath)
        server.watcher.add(utils.configFilePath)
    },

    async handleHotUpdate({ server, file, read, modules }) {
      if (file === utils.configFilePath) {
        debug.hmr(`config file changed: ${file}`)
        utils.init()
        setTimeout(() => {
          console.log(`[${NAME}] configure file changed, reloading`)
          server.ws.send({ type: 'full-reload' })
        }, 0)
        return [server.moduleGraph.getModuleById(MODULE_ID_VIRTUAL)!]
      }

      if (!utils.isDetectTarget(file))
        return

      const changed = utils.extractFile(await read(), false)
      if (!changed)
        return

      debug.hmr(`refreshed by ${file}`)
      const module = server.moduleGraph.getModuleById(MODULE_ID_VIRTUAL)!
      server.moduleGraph.invalidateModule(module)

      if (file.endsWith('.html'))
        return undefined

      return [module!, ...modules]
    },
  })

  // CSS transform
  if (options.transformCSS) {
    plugins.push({
      name: `${NAME}:css`,
      enforce: typeof options.transformCSS === 'string'
        ? options.transformCSS
        : undefined,
      transform(code, id) {
        if (!utils.isCssTransformTarget(id) || id === MODULE_ID_VIRTUAL)
          return
        debug.css(id)
        return utils.transformCSS(code)
      },
    })
  }

  return plugins
}

export * from '@windicss/plugin-utils'
export default VitePluginWindicss
