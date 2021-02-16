import { promises as fs, existsSync } from 'fs'
import { join, resolve } from 'path'
import WindiCssProcessor from 'windicss'
import { StyleSheet } from 'windicss/utils/style'
import { CSSParser } from 'windicss/utils/parser'
import fg from 'fast-glob'
import _debug from 'debug'
import { regexQuotedString, regexClassSplitter, regexClassCheck, regexHtmlTag, preflightTags, htmlTags, defaultAlias, TagNames } from './constants'
import { resolveOptions, WindiCssOptions, WindiBoxOptions } from './options'

import { toArray, kebabCase, include, exclude } from './utils'

export type WindiBox = ReturnType<typeof createBox>

export { preflightTags, htmlTags, defaultAlias }
export type { WindiBoxOptions, TagNames }

export function createBox(_options: WindiBoxOptions = {}) {
  const options = resolveOptions(_options)

  const {
    name,
    windicssOptions,
    searchExtensions,
    searchDirs,
    searchExclude,
    transformCSS: enableCssTransform,
    preflight,
    preflightOptions,
    sortUtilities,
    root,
    safelist,
  } = options

  const debug = {
    config: _debug(`${name}:config`),
    debug: _debug(`${name}:debug`),
    compile: _debug(`${name}:compile`),
    glob: _debug(`${name}:glob`),
    detect: _debug(`${name}:detect`),
  }

  let processor: WindiCssProcessor
  let configFilePath: string | undefined

  const regexId = new RegExp(`\\.(?:${searchExtensions.join('|')})$`, 'i')

  const configSafelist = new Set<string>()

  const classesGenerated = new Set<string>()
  const classesPending = new Set<string>()
  const tagsGenerated = new Set<string>()
  const tagsPending = new Set<string>()
  const tagsAvailable = new Set<string>()

  function loadConfiguration() {
    let options: WindiCssOptions = {}
    if (typeof windicssOptions === 'string') {
      const path = resolve(root, windicssOptions)
      if (!existsSync(path)) {
        console.warn(`[${name}] config file "${windicssOptions}" not found, ignored`)
      }
      else {
        try {
          delete require.cache[require.resolve(path)]
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          options = require(path)
          configFilePath = path
          configSafelist.clear()
          // @ts-expect-error
          include(configSafelist, options?.purge?.options?.safelist || options?.purge?.options?.whitelist || [])
        }
        catch (e) {
          console.error(`[${name}] failed to load config "${windicssOptions}"`)
          console.error(`[${name}] ${e.toString()}`)
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
    return new WindiCssProcessor(loadConfiguration())
  }

  let _searching: Promise<void> | null

  async function search() {
    if (!_searching) {
      _searching = (async() => {
        const globs = searchDirs.map(i => join(i, `**/*.{${searchExtensions.join(',')}}`).replace(/\\/g, '/'))
        globs.unshift('index.html')

        debug.glob('globs', globs)

        const files = await fg(
          globs,
          {
            cwd: root,
            ignore: ['node_modules', '.git', ...searchExclude],
            onlyFiles: true,
            absolute: true,
          },
        )

        files.sort()

        debug.glob('files', files)

        const contents = await Promise.all(files.map(async id => [await fs.readFile(id, 'utf-8'), id]))

        for (const [content, id] of contents)
          extractFile(content, id)
      })()
    }

    return _searching
  }

  function isDetectTarget(id: string) {
    return id.match(regexId)
  }

  function extractFile(code: string, id: string) {
    if (!isDetectTarget(id))
      return

    debug.detect(id)
    // classes
    Array.from(code.matchAll(regexQuotedString))
      .flatMap(m => m[2]?.split(regexClassSplitter) || [])
      .filter(i => i.match(regexClassCheck))
      .forEach((i) => {
        if (!i || classesGenerated.has(i))
          return
        classesPending.add(i)
      })

    if (preflight) {
      // preflight
      Array.from(code.matchAll(regexHtmlTag))
        .flatMap(([, i]) => i)
        .forEach((i) => {
          if (!tagsAvailable.has(i))
            i = preflightOptions.alias[kebabCase(i)]
          if (!tagsAvailable.has(i))
            return
          tagsPending.add(i)
          tagsAvailable.delete(i)
        })
    }

    debug.detect('classes', classesPending)
    debug.detect('tags', tagsPending)
  }

  function transformCSS(css: string) {
    if (!enableCssTransform)
      return css
    const style = new CSSParser(css, processor).parse()
    return style.build()
  }

  let style: StyleSheet = new StyleSheet()
  let _cssCache: string | undefined

  async function generateCSS() {
    await search()

    let changed = false

    if (classesPending.size) {
      const result = processor.interpret(Array.from(classesPending).join(' '))
      if (result.success.length) {
        include(classesGenerated, result.success)
        classesPending.clear()
        debug.compile(`compiled ${result.success.length} classes`)
        debug.compile(result.success)

        style = style.extend(result.styleSheet)
        changed = true
      }
    }

    if (preflight && tagsPending.size) {
      const preflightStyle = processor.preflight(
        Array.from(tagsPending).map(i => `<${i}`).join(' '),
        preflightOptions.includeBase,
        preflightOptions.includeGlobal,
        preflightOptions.includePlugin,
      )
      style = style.extend(preflightStyle, true)
      include(tagsGenerated, tagsPending)
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

  function clearCache() {
    style = new StyleSheet()
    _cssCache = undefined

    const preflightSafelist = toArray(preflightOptions?.safelist || []).flatMap(i => i.split(' '))

    include(classesPending, configSafelist)
    include(classesPending, safelist)
    include(classesPending, classesGenerated)

    include(tagsPending, tagsGenerated)
    include(tagsPending, preflightTags)
    include(tagsPending, preflightSafelist)
    include(tagsAvailable, htmlTags as any as string[])

    exclude(tagsAvailable, preflightTags)
    exclude(tagsAvailable, preflightSafelist)

    classesGenerated.clear()
    tagsGenerated.clear()
  }

  function init() {
    processor = initWindicss()
    clearCache()
  }

  return {
    options,
    init,
    extractFile,
    generateCSS,
    clearCache,
    transformCSS,
    isDetectTarget,

    classesGenerated,
    classesPending,
    tagsGenerated,
    tagsPending,
    tagsAvailable,

    get configFilePath() {
      return configFilePath
    },
  }
}
