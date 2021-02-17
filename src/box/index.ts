import { promises as fs, existsSync } from 'fs'
import { join, resolve } from 'path'
import WindiCssProcessor from 'windicss'
import { StyleSheet } from 'windicss/utils/style'
import { CSSParser } from 'windicss/utils/parser'
import fg from 'fast-glob'
import _debug from 'debug'
import { regexQuotedString, regexClassSplitter, regexClassCheck, regexHtmlTag, preflightTags, htmlTags, defaultAlias, TagNames, regexClassGroup } from './constants'
import { resolveOptions, WindiCssOptions, WindiBoxOptions } from './options'

import { toArray, kebabCase, include, exclude } from './utils'

export type WindiBox = ReturnType<typeof createBox>

export { preflightTags, htmlTags, defaultAlias }
export type { WindiBoxOptions, TagNames }

export function createBox(_options: WindiBoxOptions = {}) {
  const options = resolveOptions(_options)

  const {
    name,
    config,
    scan: enabledScan,
    scanOptions,
    transformCSS: enableCssTransform,
    preflight: enablePreflight,
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

  const regexId = new RegExp(`\\.(?:${scanOptions.fileExtensions.join('|')})$`, 'i')

  const configSafelist = new Set<string>()

  const classesGenerated = new Set<string>()
  const classesPending = new Set<string>()
  const tagsGenerated = new Set<string>()
  const tagsPending = new Set<string>()
  const tagsAvailable = new Set<string>()

  function loadConfiguration() {
    let resolved: WindiCssOptions = {}
    if (typeof config === 'string') {
      const path = resolve(root, config)
      if (!existsSync(path)) {
        console.warn(`[${name}] config file "${config}" not found, ignored`)
      }
      else {
        try {
          delete require.cache[require.resolve(path)]
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          resolved = require(path)
          configFilePath = path
          configSafelist.clear()
          // @ts-expect-error
          include(configSafelist, resolved?.purge?.options?.safelist || resolved?.purge?.options?.whitelist || [])
        }
        catch (e) {
          console.error(`[${name}] failed to load config "${config}"`)
          console.error(`[${name}] ${e.toString()}`)
          process.exit(1)
        }
      }
    }
    else {
      resolved = config
    }

    debug.config(JSON.stringify(resolved, null, 2))
    return resolved
  }

  function initWindicss() {
    return new WindiCssProcessor(loadConfiguration())
  }

  let _searching: Promise<void> | null

  async function scan() {
    if (!_searching) {
      const { fileExtensions, dirs, include, exclude } = scanOptions
      _searching = (async() => {
        const globs = dirs.map(i => join(i, `**/*.{${fileExtensions.join(',')}}`).replace(/\\/g, '/'))
        globs.unshift('index.html')
        globs.unshift(...include)

        debug.glob('globs', globs)

        const files = await fg(
          globs,
          {
            cwd: root,
            ignore: ['node_modules', '.git', ...exclude],
            onlyFiles: true,
            absolute: true,
          },
        )

        files.sort()

        debug.glob('files', files)

        const contents = await Promise.all(
          files
            .filter(id => isDetectTarget(id))
            .map(id => fs.readFile(id, 'utf-8')),
        )

        for (const content of contents)
          extractFile(content)
      })()
    }

    return _searching
  }

  function isDetectTarget(id: string) {
    return id.match(regexId)
  }

  function extractFile(code: string) {
    // classes
    Array.from(code.matchAll(regexQuotedString))
      .flatMap(m => (m[2] || '')
        .replace(regexClassGroup, (v) => {
          if (!classesGenerated.has(v))
            classesPending.add(v)
          return ''
        })
        .split(regexClassSplitter),
      )
      .filter(i => i.match(regexClassCheck))
      .forEach((i) => {
        if (!i || classesGenerated.has(i))
          return
        classesPending.add(i)
      })

    if (enablePreflight) {
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
    if (enabledScan && scanOptions.runOnStartup)
      await scan()

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

    if (enablePreflight && tagsPending.size) {
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
    scan,

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
