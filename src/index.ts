import { promises as fs, existsSync } from 'fs'
import { join, resolve } from 'path'
import type { Plugin, ResolvedConfig } from 'vite'
import fg from 'fast-glob'
import Windicss from 'windicss'
import { StyleSheet } from 'windicss/utils/style'
import { CSSParser } from 'windicss/utils/parser'
import { Config as WindiCssOptions } from 'windicss/types/interfaces'
import { pascalCase, toArray, remove, add } from './utils'
import { htmlTags, MODULE_ID, MODULE_ID_VIRTUAL, preflightTags, regexQuotedString, regexClassCheck } from './constants'
import { debug } from './debug'
import { Options, AliasOptions } from './types'

function VitePluginWindicss(options: Options = {}): Plugin[] {
  const {
    windicssOptions = 'tailwind.config.js',
    searchExtensions = ['html', 'vue', 'pug', 'jsx', 'tsx', 'svelte'],
    searchDirs = ['src'],
    preflight = true,
    transformCSS = true,
  } = options

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

  const alias = new Map<string, string>()

  const resolvedAlias: AliasOptions = {
    'router-link': 'a',
    ...options.alias,
  }

  Object.keys(resolvedAlias).forEach((find) => {
    alias.set(find, resolvedAlias[find])
    alias.set(pascalCase(find), resolvedAlias[find])
  })

  const preflightOptions = Object.assign({
    includeBase: true,
    includeGlobal: true,
    includePlugin: true,
  }, typeof preflight === 'boolean' ? {} : preflight)

  function initWindicss() {
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
          add(configSafelist, options?.purge?.options?.safelist || options?.purge?.options?.whitelist || [])
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

    function addTag(i: string) {
      if (!tagsAvailable.has(i))
        return
      tagsPending.add(i)
      tagsAvailable.delete(i)
    }

    // preflight
    Array.from(code.matchAll(/<([a-z]+[0-9]?)/g))
      .flatMap(([, i]) => i)
      .forEach(i => addTag(i))

    alias.forEach((replace, find) => {
      if (code.includes(`<${find}`))
        addTag(replace)
    })

    debug.detect('classes', classesPending)
    debug.detect('tags', tagsPending)
  }

  function convertCSS(css: string) {
    const style = new CSSParser(css, windi).parse()
    return style.build()
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
        debug.compile(result.success)

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
    windi = initWindicss()
    style = new StyleSheet()

    const preflightSafelist = toArray(preflightOptions?.safelist || []).flatMap(i => i.split(' '))

    debug.config('alias', alias)
    debug.config('safelist', safelist)
    debug.config('configSafelist', configSafelist)
    debug.config('preflightSafelist', preflightSafelist)

    add(classesPending, configSafelist)
    add(classesPending, safelist)
    add(classesPending, classes)
    add(tagsPending, tags)
    add(tagsPending, preflightTags)
    add(tagsPending, preflightSafelist)
    add(tagsAvailable, htmlTags)
    remove(tagsAvailable, preflightSafelist)

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

export default VitePluginWindicss
