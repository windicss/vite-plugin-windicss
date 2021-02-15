import { promises as fs, existsSync } from 'fs'
import { join, resolve } from 'path'
import { Plugin, ResolvedConfig } from 'vite'
import fg from 'fast-glob'
import Windicss from 'windicss'
import { StyleSheet } from 'windicss/utils/style'
import { CSSParser } from 'windicss/utils/parser'
import { Config as WindiCssOptions } from 'windicss/types/interfaces'
import { toArray, exclude, include, kebabCase } from './utils'
import { htmlTags, MODULE_ID, MODULE_ID_VIRTUAL, preflightTags, regexQuotedString, regexClassCheck, regexHtmlTag } from './constants'
import { debug } from './debug'
import { Options, TagNames } from './types'

export const defaultAlias: Record<string, TagNames> = {
  'router-link': 'a',
}

function resolveOptions(options: Options) {
  const {
    windicssOptions = 'tailwind.config.js',
    searchExtensions = ['html', 'vue', 'pug', 'jsx', 'tsx', 'svelte'],
    searchDirs = ['src'],
    preflight = true,
    transformCSS = true,
    sortUtilities = true,
  } = options

  const preflightOptions = Object.assign({
    includeBase: true,
    includeGlobal: true,
    includePlugin: true,
    alias: {},
  }, typeof preflight === 'boolean' ? {} : preflight)

  preflightOptions.alias = Object.fromEntries(
    Object.entries({
      ...defaultAlias,
      ...preflightOptions.alias,
    }).filter(([k, v]) => [kebabCase(k), v]),
  )

  return {
    windicssOptions,
    searchExtensions,
    searchDirs,
    transformCSS,
    preflight: Boolean(preflight),
    preflightOptions,
  }
}

function VitePluginWindicss(options: Options = {}): Plugin[] {
  const {
    windicssOptions,
    searchExtensions,
    searchDirs,
    transformCSS,
    preflight,
    preflightOptions,
  } = resolveOptions(options)

  let config: ResolvedConfig
  let windi: Windicss
  let windiConfigFile: string | undefined
  const configSafelist = new Set<string>()
  const safelist = toArray(options.safelist || []).flatMap(i => i.split(' '))

  const regexId = new RegExp(`\\.(?:${searchExtensions.join('|')})$`, 'i')

  const classes = new Set<string>()
  const classesPending = new Set<string>()
  const tags = new Set<string>()
  const tagsPending = new Set<string>()
  const tagsAvailable = new Set<string>()

  function loadConfiguration() {
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
          configSafelist.clear()
          // @ts-expect-error
          include(configSafelist, options?.purge?.options?.safelist || options?.purge?.options?.whitelist || [])
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
    return options
  }

  function initWindicss() {
    return new Windicss(loadConfiguration())
  }

  let _searching: Promise<void> | null

  async function search() {
    if (!_searching) {
      _searching = (async() => {
        const globs = searchDirs.map(i => join(i, `**/*.{${searchExtensions.join(',')}}`).replace(/\\/g, '/'))
        debug.glob(globs)

        const files = await fg(
          globs,
          {
            onlyFiles: true,
            cwd: config.root,
            absolute: true,
          },
        )

        files.unshift(join(config.root, 'index.html'))

        debug.glob('files', files)

        await Promise.all(files.map(async(id) => {
          const content = await fs.readFile(id, 'utf-8')
          detectFile(content, id)
        }))
      })()
    }

    return _searching
  }

  function isDetectTarget(id: string) {
    return id.match(regexId)
  }

  function detectFile(code: string, id: string) {
    if (!isDetectTarget(id))
      return

    debug.detect(id)
    // classes
    Array.from(code.matchAll(regexQuotedString))
      .flatMap(m => m[2]?.split(' ') || [])
      .filter(i => i.match(regexClassCheck))
      .forEach((i) => {
        if (!i || classes.has(i))
          return
        classesPending.add(i)
      })

    if (preflight) {
      // preflight
      Array.from(code.matchAll(regexHtmlTag))
        .flatMap(([, i]) => i)
        .forEach((i) => {
          if (!tagsAvailable.has(i)) {
            debug.debug(i, kebabCase(i))
            i = preflightOptions.alias[kebabCase(i)]
          }
          if (!tagsAvailable.has(i))
            return
          tagsPending.add(i)
          tagsAvailable.delete(i)
        })
    }

    debug.detect('classes', classesPending)
    debug.detect('tags', tagsPending)
  }

  function convertCSS(css: string) {
    const style = new CSSParser(css, windi).parse()
    return style.build()
  }

  let style: StyleSheet = new StyleSheet()
  let _cssCache: string | undefined

  async function generateCSS() {
    await search()

    let changed = false

    if (classesPending.size) {
      const result = windi.interpret(Array.from(classesPending).join(' '))
      if (result.success.length) {
        include(classes, result.success)
        classesPending.clear()
        debug.compile(`compiled ${result.success.length} classes`)
        debug.compile(result.success)

        style = style.extend(result.styleSheet)
        changed = true
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
      include(tags, tagsPending)
      tagsPending.clear()
      changed = true
    }

    if (changed || !_cssCache) {
      if (sortUtilities)
        style.sort()

      _cssCache = style.build()
    }
    return _cssCache
  }

  function reset() {
    windi = initWindicss()
    style = new StyleSheet()

    const preflightSafelist = toArray(preflightOptions?.safelist || []).flatMap(i => i.split(' '))

    debug.config('safelist', safelist)
    debug.config('configSafelist', configSafelist)
    debug.config('preflightSafelist', preflightSafelist)

    include(classesPending, configSafelist)
    include(classesPending, safelist)
    include(classesPending, classes)
    include(tagsPending, tags)
    include(tagsPending, preflightTags)
    include(tagsPending, preflightSafelist)
    include(tagsAvailable, htmlTags as any as string[])

    exclude(tagsAvailable, preflightTags)
    exclude(tagsAvailable, preflightSafelist)

    classes.clear()
    tags.clear()
  }

  const plugins: Plugin[] = [
    {
      name: 'vite-plugin-windicss:pre',
      enforce: 'pre',

      configResolved(_config) {
        config = _config
        reset()
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

      async handleHotUpdate({ server, file, read, modules, timestamp }) {
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

        const module = server.moduleGraph.getModuleById(MODULE_ID_VIRTUAL)!

        if (file.endsWith('.html')) {
          module.lastHMRTimestamp = timestamp
          module.transformResult = null
          return undefined
        }

        return [module!, ...modules]
      },
    },
  ]

  if (transformCSS) {
    plugins.push({
      name: 'vite-plugin-windicss:css',
      transform(code, id) {
        if (id.match(/\.(post)?css(?:$|\?)/)) {
          debug.css(id)
          return convertCSS(code)
        }
      },
    })
  }

  return plugins
}

export * from './types'
export default VitePluginWindicss
