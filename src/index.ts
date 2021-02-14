import { promises as fs, existsSync } from 'fs'
import { join, resolve } from 'path'
import type { Plugin, ResolvedConfig } from 'vite'
import fg from 'fast-glob'
import Windicss from 'windicss'
import { StyleSheet } from 'windicss/utils/style'
import { Config as WindiCssOptions } from 'windicss/types/interfaces'
import { htmlTags, MODULE_ID, MODULE_ID_VIRTUAL } from './constants'
import { debug } from './debug'
import { Options } from './types'

function VitePluginWindicss(options: Options = {}): Plugin[] {
  const {
    windicssOptions = 'tailwind.config.js',
    searchExtensions = ['html', 'vue', 'pug'],
    searchDirs = ['src'],
    preflight = true,
  } = options

  let config: ResolvedConfig
  let windi: Windicss
  let windiConfigFile: string | undefined
  const extensionRegex = new RegExp(`\\.(?:${searchExtensions.join('|')})$`, 'i')

  const classes = new Set<string>()
  const classesPending = new Set<string>()

  const tags = new Set<string>()
  const tagsPending = new Set<string>(['html', 'body', 'div'])
  const tagsAvaliable = new Set(htmlTags)

  const preflightOptions = Object.assign({
    includeBase: true,
    includeGlobal: true,
    includePlugin: true,
  }, typeof preflight === 'boolean' ? {} : preflight)

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
          },
        )

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
    Array.from(code.matchAll(/['"`]([\w -/:]+)[`'"]/g))
      .flatMap(([, i]) => i.split(' '))
      .forEach((i) => {
        if (!i || classes.has(i))
          return
        classesPending.add(i)
      })

    Array.from(code.matchAll(/<(\w+)/g))
      .flatMap(([, i]) => i.toLowerCase())
      .forEach((i) => {
        if (!tagsAvaliable.has(i))
          return
        tagsPending.add(i)
        tagsAvaliable.delete(i)
      })

    debug.detect('classes', classesPending)
    debug.detect('tags', tagsPending)
  }

  function add<T>(set: Set<T>, v: T[] | Set<T>) {
    for (const i of v)
      set.add(i)
  }

  let style: StyleSheet = new StyleSheet()

  async function generateCSS() {
    await search()

    if (classesPending.size) {
      const result = windi.interpret(Array.from(classesPending).join(' '))
      if (result.success.length) {
        add(classes, result.success)
        classesPending.clear()
        debug.compile(`compiled ${result.success.length} classes`)

        style = style.extend(result.styleSheet)
      }
    }

    if (preflight && tagsPending.size) {
      const preflightStyle = windi.preflight(
        Array.from(tagsPending).map(i => `<${i}`).join(' '),
        preflightOptions.includeBase,
        preflightOptions.includeGlobal,
        preflightOptions.includePlugin,
      )
      style = style.extend(preflightStyle, true)
      add(tags, tagsPending)
      tagsPending.clear()
    }

    const css = style.build()
    return css
  }

  function reset() {
    windi = createWindicss()
    style = new StyleSheet()
    add(classesPending, classes)
    add(tagsPending, tags)
    classes.clear()
    tags.clear()
    add(tagsAvaliable, htmlTags)
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
        if (id === MODULE_ID_VIRTUAL)
          return generateCSS()
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
          reset()
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
