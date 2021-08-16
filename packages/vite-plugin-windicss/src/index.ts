import { resolve } from 'path'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import _debug, { log } from 'debug'
import { walk } from 'estree-walker'
import MagicString from 'magic-string'
import { UserOptions, WindiPluginUtils, createUtils, WindiPluginUtilsOptions } from '@windicss/plugin-utils'
import { createVirtualModuleLoader, MODULE_ID_VIRTUAL_PREFIX } from '../../shared/virtual-module'
import { createDevtoolsPlugin } from './devtools'
import { NAME } from './constants'
import { getCssModules, reloadChangedCssModules } from './modules'

const debug = {
  hmr: _debug(`${NAME}:hmr`),
  css: _debug(`${NAME}:transform:css`),
  styledComponents: _debug(`${NAME}:transform:styledComponents`),
  group: _debug(`${NAME}:transform:group`),
  alias: _debug(`${NAME}:transform:alias`),
  memory: _debug(`${NAME}:memory`),
}

function VitePluginWindicss(userOptions: UserOptions = {}, utilsOptions: WindiPluginUtilsOptions = {}): Plugin[] {
  let utils: WindiPluginUtils
  // let viteConfig: ResolvedConfig
  let server: ViteDevServer | undefined
  let viteConfig: ResolvedConfig

  const plugins: Plugin[] = []

  // transform alias
  plugins.push({
    name: `${NAME}:alias`,
    enforce: 'pre',
    configResolved(_config) {
      viteConfig = _config
    },
    async transform(code, id) {
      await utils.ensureInit()
      if (!utils.isDetectTarget(id))
        return
      debug.alias(id)
      return utils.transformAlias(code, !!viteConfig.build.sourcemap)
    },
  })

  // Utilities grouping transform
  if (userOptions.transformGroups !== false) {
    plugins.push({
      name: `${NAME}:groups`,
      enforce: 'pre',
      async transform(code, id) {
        await utils.ensureInit()
        if (!utils.isDetectTarget(id))
          return
        debug.group(id)
        return utils.transformGroups(code, !!viteConfig.build.sourcemap)
      },
    })
  }

  if (userOptions.transformStyledComponents) {
    plugins.push({
      name: `${NAME}:styled-components`,
      async transform(code, id) {
        await utils.ensureInit()
        if (!utils.isDetectTarget(id) || !code.includes('styled-components'))
          return
        debug.styledComponents(id)
        const parsed = this.parse(code, {})
        let ms: MagicString
        walk(parsed, {
          enter: (node: any) => {
            if (node.type === 'TemplateElement' && node.value.cooked.includes('@apply')) {
              const next = node.value.cooked.replace(
                /(.*)@apply([^`$]*)\n/gm,
                (_match: string, pre: string, applyCss: string) => {
                  const parsed = utils.transformCSS(`&{@apply ${applyCss}}`, id)
                  return `${pre} ${parsed}`
                }
              )

              ms = ms || new MagicString(code)
              ms.overwrite(
                node.start,
                node.end,
                next,
              )
            }
          },
        })
        if (ms!) {
          return {
            code: ms.toString(),
            map: ms.generateMap({
              file: id,
              includeContent: true,
              hires: true,
            }),
          }
        }
        return null
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

    configureServer(_server) {
      server = _server
    },

    async configResolved(_config) {
      // viteConfig = _config
      utils = utilsOptions.utils ?? createUtils(userOptions, {
        name: NAME,
        root: _config.root,
        onConfigurationError(e) {
          if (_config.command === 'build') {
            throw e
          }
          else {
            console.error(`[${NAME}] Error on loading configurations`)
            console.error(e)
          }
        },
        ...utilsOptions,
      })
      await utils.ensureInit()
    },

    ...createVirtualModuleLoader({ get utils() { return utils } }),
  })

  let _cssReloadTask: any
  function reloadCssModules(server: ViteDevServer) {
    clearTimeout(_cssReloadTask)
    _cssReloadTask = setTimeout(() => {
      reloadChangedCssModules(server, utils)
    }, 1)
  }

  // HMR
  plugins.push({
    name: `${NAME}:hmr`,
    apply: 'serve',
    enforce: 'pre',

    async configureServer(_server) {
      server = _server

      await utils.ensureInit()
      if (utils.configFilePath)
        server.watcher.add(utils.configFilePath)

      // NOTE: Track changes to the files so that they are re-scanned as needed.
      // Added files are only detected if the user explicitly enables globbing.
      const supportsGlobs = server.config.server.watch?.disableGlobbing === false
      server.watcher.add(supportsGlobs ? utils.globs : await utils.getFiles())
    },

    async handleHotUpdate({ server, file, read }) {
      // resolve normalized file path to system path
      if (resolve(file) === utils.configFilePath) {
        debug.hmr(`config file changed: ${file}`)
        await utils.init()
        setTimeout(() => {
          log('configure file changed, reloading')
          server.ws.send({ type: 'full-reload' })
        }, 0)
        return getCssModules(server)
      }

      if (!utils.isDetectTarget(file))
        return

      utils.extractFile(await read(), file, true)
        .then((changed) => {
          if (changed) {
            debug.hmr(`refreshed by ${file}`)
            reloadCssModules(server)
          }
        })
    },
  })

  const { transformCSS: transformCSSOptions = true } = userOptions

  const transformCSS = (code: string, id: string) => utils.transformCSS(code, id, {
    onLayerUpdated() {
      if (server)
        reloadCssModules(server)
    },
  })

  // CSS transform
  if (transformCSSOptions === true) {
    plugins.push({
      name: `${NAME}:css`,
      async transform(code, id) {
        await utils.ensureInit()
        if (!utils.isCssTransformTarget(id) || id.startsWith(MODULE_ID_VIRTUAL_PREFIX))
          return
        debug.css(id)
        code = transformCSS(code, id)
        if (viteConfig.build.sourcemap) {
          return {
            code: transformCSS(code, id),
            map: { mappings: '' },
          }
        }
        else {
          return code
        }
      },
    })
  }
  else if (typeof transformCSSOptions === 'string') {
    plugins.push({
      name: `${NAME}:css`,
      enforce: transformCSSOptions,
      transform(code, id) {
        if (!utils.isCssTransformTarget(id) || id.startsWith(MODULE_ID_VIRTUAL_PREFIX))
          return
        debug.css(id, transformCSSOptions)
        code = transformCSS(code, id)
        if (viteConfig.build.sourcemap) {
          return {
            code: transformCSS(code, id),
            map: { mappings: '' },
          }
        }
        else {
          return code
        }
      },
    })
  }

  plugins.push({
    name: `${NAME}:css:svelte`,
    api: {
      sveltePreprocess: {
        style({ content, id }: { content: string; id: string}) {
          return {
            code: transformCSS(content, id),
          }
        },
      },
    },
  })

  plugins.push(...createDevtoolsPlugin({ get utils() { return utils } }))

  return plugins
}

export * from '@windicss/plugin-utils'
export default VitePluginWindicss
