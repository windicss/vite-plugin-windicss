import { promises as fs } from 'fs'
import { join } from 'path'
import type { ModuleNode, Plugin, ResolvedConfig } from 'vite'
import Windicss from 'windicss'
import _debug from 'debug'
import { Config as WindiCssOptions } from 'windicss/types/interfaces'
import fg from 'fast-glob'

const debug = {
  debug: _debug('vite-plugin-windicss:debug'),
  compile: _debug('vite-plugin-windicss:compile'),
  glob: _debug('vite-plugin-windicss:glob'),
  detect: _debug('vite-plugin-windicss:detect'),
  hmr: _debug('vite-plugin-windicss:hmr'),
}

export interface Options {
  windicssOptions?: WindiCssOptions

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
    windicssOptions,
    searchExtensions = ['html', 'vue', 'pug'],
    searchDirs = ['src'],
  } = options

  let config: ResolvedConfig
  const windi = new Windicss(windicssOptions)
  const extensionRegex = new RegExp(`\\.(?:${searchExtensions.join('|')})$`, 'i')

  const names = new Set<string>()
  const ignored = new Set<string>()

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

      transformIndexHtml(code) {
        return code
      },
    },
    {
      name: 'vite-plugin-windicss:hmr',
      apply: 'serve',
      enforce: 'post',

      async handleHotUpdate({ server, file, read, timestamp, modules }) {
        if (!isDetectTarget(file))
          return

        debug.hmr(`refreshed by ${file}`)

        detectFile(await read(), file)

        // server.ws.send({
        //   type: 'update',
        //   updates: [
        //     {
        //       type: 'js-update',
        //       timestamp,
        //       path: MODULE_ID_VIRTUAL,
        //       acceptedPath: MODULE_ID_VIRTUAL,
        //     },
        //   ],
        // })

        const module = server.moduleGraph.getModuleById(MODULE_ID_VIRTUAL)
        return [module!, ...modules]
      },
    },
  ]
}

export default VitePluginWindicss
