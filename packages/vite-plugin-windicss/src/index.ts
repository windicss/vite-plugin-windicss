import { resolve } from 'path'
import type { Plugin, ResolvedConfig } from 'vite'
import _debug, { log } from 'debug'
import { UserOptions, WindiPluginUtils, createUtils } from '@windicss/plugin-utils'
import { createDevtoolsPlugin } from './devtools'
import { NAME, MODULE_IDS, MODULE_ID_VIRTUAL } from './constants'

const debug = {
  hmr: _debug(`${NAME}:hmr`),
  css: _debug(`${NAME}:transform:css`),
  group: _debug(`${NAME}:transform:group`),
}

function VitePluginWindicss(userOptions: UserOptions = {}): Plugin[] {
  let utils: WindiPluginUtils
  let viteConfig: ResolvedConfig

  const plugins: Plugin[] = []

  // Utilities grouping transform
  if (userOptions.transformGroups !== false) {
    plugins.push({
      name: `${NAME}:groups`,
      transform(code, id) {
        if (!utils.isDetectTarget(id))
          return
        debug.group(id)
        if (viteConfig.build.sourcemap)
          return utils.transformGroupsWithSourcemap(code)
        else
          return utils.transformGroups(code)
      },
    })
  }

  // exposing api
  plugins.push({
    name: NAME,
    get api() {
      return utils
    },
  })

  // CSS Entry via virtual module
  plugins.push({
    name: `${NAME}:entry`,
    enforce: 'post',

    async configResolved(_config) {
      viteConfig = _config
      utils = createUtils(userOptions, {
        name: NAME,
        root: _config.root,
      })
      await utils.init()
    },

    resolveId(id) {
      return MODULE_IDS.includes(id) || MODULE_IDS.some(i => id.startsWith(i))
        ? MODULE_ID_VIRTUAL
        : null
    },

    async load(id) {
      if (id === MODULE_ID_VIRTUAL)
        return await utils.generateCSS()
    },
  })

  // HMR
  plugins.push({
    name: `${NAME}:hmr`,
    apply: 'serve',
    enforce: 'post',

    async configureServer(server) {
      if (utils.configFilePath)
        server.watcher.add(utils.configFilePath)

      // NOTE: Track changes to the files so that they are re-scanned as needed.
      // Added files are only detected if the user explicitly enables globbing.
      const supportsGlobs = server.config.server.watch?.disableGlobbing === false
      server.watcher.add(supportsGlobs ? utils.globs : await utils.getFiles())
    },

    async handleHotUpdate({ server, file, read, modules }) {
      // resolve normalized file path to system path
      if (resolve(file) === utils.configFilePath) {
        debug.hmr(`config file changed: ${file}`)
        await utils.init()
        setTimeout(() => {
          log('configure file changed, reloading')
          server.ws.send({ type: 'full-reload' })
        }, 0)
        return [server.moduleGraph.getModuleById(MODULE_ID_VIRTUAL)!]
      }

      if (!utils.isDetectTarget(file))
        return

      const changed = utils.extractFile(await read(), file, true)
      if (!changed)
        return

      debug.hmr(`refreshed by ${file}`)
      const module = server.moduleGraph.getModuleById(MODULE_ID_VIRTUAL)
      if (module)
        server.moduleGraph.invalidateModule(module)

      if (file.endsWith('.html'))
        return undefined

      return [module!, ...modules].filter(Boolean)
    },
  })

  const { transformCSS = true } = userOptions

  // CSS transform
  if (transformCSS === true) {
    plugins.push({
      name: `${NAME}:css`,
      transform(code, id) {
        if (!utils.isCssTransformTarget(id) || id === MODULE_ID_VIRTUAL)
          return
        debug.css(id)
        return utils.transformCSS(code)
      },
    })
  }
  else if (typeof transformCSS === 'string') {
    plugins.push({
      name: `${NAME}:css`,
      enforce: transformCSS,
      transform(code, id) {
        if (!utils.isCssTransformTarget(id) || id === MODULE_ID_VIRTUAL)
          return
        debug.css(id)
        return utils.transformCSS(code)
      },
    })
  }

  plugins.push({
    name: `${NAME}:css:svelte`,
    // @ts-expect-error for svelte preprocess
    sveltePreprocess: {
      style({ content }: { content: string }) {
        return {
          code: utils.transformCSS(content),
        }
      },
    },
  })

  plugins.push(...createDevtoolsPlugin({ get utils() { return utils } }))

  return plugins
}

export * from '@windicss/plugin-utils'
export default VitePluginWindicss
