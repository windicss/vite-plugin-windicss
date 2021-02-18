import { Plugin } from 'vite'
import _debug from 'debug'
import { WindiBoxOptions, createBox, WindiBox } from './box'
import { transfromGroups } from './box/utils'

const NAME = 'vite-plugin-windicss'
const MODULE_ID = 'windi.css'
const MODULE_ID_VIRTUAL = `/@windicss/${MODULE_ID}`

const debug = {
  hmr: _debug(`${NAME}:hmr`),
  css: _debug(`${NAME}:css-transform`),
}

export type UserOptions = Exclude<WindiBoxOptions, 'name' | 'root'>

function VitePluginWindicss(options: UserOptions = {}): Plugin[] {
  let box: WindiBox

  const plugins: Plugin[] = []

  if (options.transformGroups !== false) {
    plugins.push({
      name: `${NAME}:groups`,
      transform(code, id) {
        if (!box.options.scan || box.files.some(file => id.startsWith(file)))
          return transfromGroups(code)
      },
    })
  }

  plugins.push({
    name: `${NAME}:pre`,
    enforce: 'pre',

    configResolved(_config) {
      box = createBox({
        ...options,
        name: NAME,
        root: _config.root,
      })
      box.init()
    },

    resolveId(id): string | null {
      return id.startsWith(MODULE_ID) || id === MODULE_ID_VIRTUAL
        ? MODULE_ID_VIRTUAL
        : null
    },

    async load(id) {
      if (id === MODULE_ID_VIRTUAL)
        return box.generateCSS()
    },
  })

  plugins.push({
    name: `${NAME}:hmr`,
    apply: 'serve',
    enforce: 'post',

    configureServer(server) {
      if (box.configFilePath)
        server.watcher.add(box.configFilePath)
    },

    async handleHotUpdate({ server, file, read, modules }) {
      if (file === box.configFilePath) {
        debug.hmr(`config file changed: ${file}`)
        box.init()
        setTimeout(() => {
          console.log(`[${NAME}] configure file changed, reloading`)
          server.ws.send({ type: 'full-reload' })
        }, 0)
        return [server.moduleGraph.getModuleById(MODULE_ID_VIRTUAL)!]
      }

      if (!box.isDetectTarget(file))
        return

      debug.hmr(`refreshed by ${file}`)

      box.extractFile(await read())

      const module = server.moduleGraph.getModuleById(MODULE_ID_VIRTUAL)!
      server.moduleGraph.invalidateModule(module)

      if (file.endsWith('.html'))
        return undefined

      return [module!, ...modules]
    },
  })

  if (options.transformCSS !== false) {
    plugins.push({
      name: `${NAME}:css`,
      transform(code, id) {
        debug.css(id)
        if (id.match(/\.(?:postcss|scss|sass|css|stylus)(?:$|\?)/i))
          return box.transformCSS(code)
      },
    })
  }

  return plugins
}

export * from './box'
export default VitePluginWindicss
