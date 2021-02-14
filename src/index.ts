import { promises as fs, existsSync } from 'fs'
import { join, resolve } from 'path'
import type { Plugin, ResolvedConfig } from 'vite'
import Windicss from 'windicss'
import _debug from 'debug'
import { Config as WindiCssOptions } from 'windicss/types/interfaces'
import fg from 'fast-glob'

const debug = {
  config: _debug('vite-plugin-windicss:config'),
  debug: _debug('vite-plugin-windicss:debug'),
  compile: _debug('vite-plugin-windicss:compile'),
  glob: _debug('vite-plugin-windicss:glob'),
  detect: _debug('vite-plugin-windicss:detect'),
  hmr: _debug('vite-plugin-windicss:hmr'),
}

export interface Options {
  /**
   * Options for windicss/tailwindcss.
   * Also accepts string as config file path.
   *
   * @default 'tailwind.config.js'
   */
  windicssOptions?: WindiCssOptions | string

  /**
   * Directories to search for classnames
   *
   * @default 'src'
   */
  searchDirs?: string[]

  /**
   * File extension to search for classnames
   *
   * @default 'html', 'vue'
   */
  searchExtensions?: string[]
}

const MODULE_ID = 'windi.css'
const MODULE_ID_VIRTUAL = `/@windicss/${MODULE_ID}`

function VitePluginWindicss(options: Options = {}): Plugin[] {
  const {
    windicssOptions = 'tailwind.config.js',
    searchExtensions = ['html', 'vue', 'pug'],
    searchDirs = ['src'],
  } = options

  let config: ResolvedConfig
  let windi: Windicss
  let windiConfigFile: string | undefined

  function createWindicss() {
    let options: WindiCssOptions = {}
    if (typeof windicssOptions === 'string') {
      const path = resolve(config.root, windicssOptions)
      if (!existsSync(path)) {
        console.warn(`[vite-plugin-windicss] config file "${windicssOptions}" not found, ignored`)
      }
      else {
        try {
          delete require.cache[require.resolve(path)]
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          options = require(path)
          windiConfigFile = path
        }
        catch (e) {
          console.error(`[vite-plugin-windicss] failed to load config "${windicssOptions}"`)
          console.error(`[vite-plugin-windicss] ${e.toString()}`)
          process.exit(1)
        }
      }
    }
    else {
      options = windicssOptions
    }

    debug.config(JSON.stringify(options, null, 2))
    return new Windicss(options)
  }

  const extensionRegex = new RegExp(`\\.(?:${searchExtensions.join('|')})$`, 'i')

  const names = new Set<string>()
  let ignored = new Set<string>()

  let _searching: Promise<void> | null

  async function search() {
    if (!_searching) {
      _searching = (async() => {
        const files = await fg(
          searchDirs.map(i => join(i, `**/*.{${searchExtensions.join(',')}}`)),
          {
            onlyFiles: true,
            cwd: config.root,
            absolute: true,
          })

        debug.glob(files)

        await Promise.all(files.map(async(id) => {
          const content = await fs.readFile(id, 'utf-8')
          detectFile(content, id)
        }))
      })()
    }

    return _searching
  }

  function isDetectTarget(id: string) {
    return id.match(extensionRegex)
  }

  function detectFile(code: string, id: string) {
    if (!isDetectTarget(id))
      return

    debug.detect(id)
    Array.from(code.matchAll(/['"]([\w -/:]+)['"]/g))
      .flatMap(([, i]) => i.trim().split(' '))
      .forEach((i) => {
        if (ignored.has(i))
          return
        names.add(i)
      })
    debug.detect(names)
  }

  return [
    {
      name: 'vite-plugin-windicss:pre',
      enforce: 'pre',

      configResolved(_config) {
        config = _config
        windi = createWindicss()
      },

      resolveId(id): string | null {
        return id.startsWith(MODULE_ID) || id === MODULE_ID_VIRTUAL
          ? MODULE_ID_VIRTUAL
          : null
      },

      async load(id) {
        if (id === MODULE_ID_VIRTUAL) {
          await search()
          const result = windi.interpret(Array.from(names).join(' '))
          result.ignored.forEach((i) => {
            names.delete(i)
            ignored.add(i)
          })
          debug.compile(`compiling ${names.size} classes`)
          const style = result.styleSheet.build()
          return style
        }
      },
    },
    {
      name: 'vite-plugin-windicss:hmr',
      apply: 'serve',
      enforce: 'post',

      configureServer(server) {
        if (windiConfigFile)
          server.watcher.add(windiConfigFile)
      },

      async handleHotUpdate({ server, file, read, modules }) {
        if (windiConfigFile && file === windiConfigFile) {
          debug.hmr(`config file changed: ${file}`)
          windi = createWindicss()
          Array.from(ignored.values()).forEach(i => names.add(i))
          ignored = new Set()
          setTimeout(() => {
            console.log('[vite-plugin-windicss] configure file changed, reloading')
            server.ws.send({ type: 'full-reload' })
          }, 0)
          return [server.moduleGraph.getModuleById(MODULE_ID_VIRTUAL)!]
        }

        if (!isDetectTarget(file))
          return

        debug.hmr(`refreshed by ${file}`)

        detectFile(await read(), file)

        const module = server.moduleGraph.getModuleById(MODULE_ID_VIRTUAL)
        return [module!, ...modules]
      },
    },
  ]
}

export default VitePluginWindicss
