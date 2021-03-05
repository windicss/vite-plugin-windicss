import { promises as fs, existsSync } from 'fs'
import { join, resolve } from 'path'
import WindiCssProcessor from 'windicss'
import { StyleSheet } from 'windicss/utils/style'
import { CSSParser } from 'windicss/utils/parser'
import fg from 'fast-glob'
import _debug from 'debug'
import micromatch from 'micromatch'
import { preflightTags, htmlTags, configureFiles, tagsEnableAttrs } from './constants'
import { regexQuotedString, regexClassSplitter, regexClassCheck, regexHtmlTag } from './regexes'
import { resolveOptions, WindiCssOptions, WindiPluginUtilsOptions, UserOptions, ResolvedOptions } from './options'
import { kebabCase, include, exclude, slash, transformGroups, transformGroupsWithSourcemap } from './utils'

export function createUtils(
  userOptions: UserOptions | ResolvedOptions = {},
  utilsOptions: WindiPluginUtilsOptions = {},
) {
  const options = resolveOptions(userOptions)

  const {
    config,
    scan: enabledScan,
    scanOptions,
    transformGroups: enableGroupsTransform,
    transformCSS: enableCssTransform,
    preflight: enablePreflight,
    preflightOptions,
    root = utilsOptions.root || process.cwd(),
    sortUtilities,
    safelist,
    blocklist,
  } = options

  const {
    name = 'windicss-plugin-utils',
    enabledTypeScriptConfig = true,
  } = utilsOptions

  const debug = {
    config: _debug(`${name}:config`),
    debug: _debug(`${name}:debug`),
    compile: _debug(`${name}:compile`),
    glob: _debug(`${name}:scan:glob`),
    scanTransform: _debug(`${name}:scan:transform`),
    detectClass: _debug(`${name}:detect:class`),
    detectTag: _debug(`${name}:detect:tag`),
    detectAttr: _debug(`${name}:detect:attr`),
  }

  let processor: WindiCssProcessor
  let configFilePath: string | undefined

  const globs = getGlobs()
  const excludeGlobs = getExcludeGlob()
  const files: string[] = []

  const regexId = new RegExp(`\\.(?:${scanOptions.fileExtensions.join('|')})$`, 'i')

  const configSafelist = new Set<string>()

  const classesGenerated = new Set<string>()
  const classesPending = new Set<string>()
  const tagsGenerated = new Set<string>()
  const tagsPending = new Set<string>()
  const attrsGenerated = new Set<string>()
  const attrsPending = new Set<string>()
  const tagsAvailable = new Set<string>()

  function loadConfiguration() {
    let resolved: WindiCssOptions = {}
    if (typeof config === 'string' || !config) {
      let path = ''
      if (!config) {
        for (const name of configureFiles) {
          const tryPath = resolve(root, name)
          if (existsSync(tryPath)) {
            path = tryPath
            break
          }
        }
      }
      else {
        path = resolve(root, config)
        if (!existsSync(path)) {
          console.warn(`[${name}] config file "${config}" not found, ignored`)
          path = ''
        }
      }

      if (path) {
        try {
          debug.config('loading from ', path)

          if (enabledTypeScriptConfig && path.endsWith('.ts')) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            require('esbuild-register')
          }

          delete require.cache[require.resolve(path)]
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          resolved = require(path)
          // @ts-expect-error esm resolve
          if (resolved.default) resolved = resolved.default

          configFilePath = path
          configSafelist.clear()
          // @ts-expect-error
          include(configSafelist, resolved?.purge?.options?.safelist || resolved?.purge?.options?.whitelist || [])
        }
        catch (e) {
          console.error(`[${name}] failed to load config "${path}"`)
          console.error(`[${name}] ${e.toString()}`)
          setTimeout(() => process.exit(1))
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

  function getGlobs() {
    const { dirs, fileExtensions, include } = scanOptions
    const globs = fileExtensions.length
      ? dirs.map(i => slash(
        join(
          i,
          fileExtensions.length > 1
            ? `**/*.{${fileExtensions.join(',')}}`
            : `**/*.${fileExtensions[0]}`,
        ),
      ))
      : []

    globs.unshift('index.html')
    globs.unshift(...include)

    debug.glob('globs', globs)
    return globs
  }

  function getExcludeGlob() {
    return ['node_modules', '.git', ...scanOptions.exclude]
  }

  async function getFiles() {
    const files = await fg(
      globs,
      {
        cwd: root,
        ignore: excludeGlobs,
        onlyFiles: true,
        absolute: true,
      },
    )

    files.sort()

    debug.glob('files', files)

    return files
  }

  let scanned = false
  let _searching: Promise<void> | null

  async function scan() {
    if (!_searching) {
      _searching = (async() => {
        files.push(...await getFiles())

        const contents = await Promise.all(
          files
            .filter(id => isDetectTarget(id))
            .map(async id => [await fs.readFile(id, 'utf-8'), id]),
        )

        for (const [content, id] of contents)
          extractFile(content, id, true)

        scanned = true
      })()
    }

    return _searching
  }

  function isExcluded(id: string) {
    return id.match(/\b(?:node_modules|.git)\b/)
      || micromatch.isMatch(slash(id), excludeGlobs)
  }

  function isDetectTarget(id: string) {
    if (files.some(file => id.startsWith(file)))
      return true
    return id.match(regexId) && !isExcluded(id)
  }

  function isScanTarget(id: string) {
    return enabledScan
      ? files.some(file => id.startsWith(file))
      : isDetectTarget(id)
  }

  function isCssTransformTarget(id: string) {
    if (id.match(/\.(?:postcss|scss|sass|css|stylus|less)(?:$|\?)/i) && !isExcluded(id))
      return true
    return false
  }

  function extractFile(code: string, id?: string, applyGroupTransform = true) {
    if (applyGroupTransform) {
      if (enableGroupsTransform)
        code = transformGroups(code)
    }

    if (id) {
      debug.scanTransform(id)
      for (const trans of scanOptions.transformers) {
        const result = trans(code, id)
        if (result != null)
          code = result
      }
    }

    let changed = false
    // classes
    Array.from(code.matchAll(regexQuotedString))
      .flatMap(m => (m[2] || '').split(regexClassSplitter))
      .filter(i => i.match(regexClassCheck))
      .forEach((i) => {
        if (!i || classesGenerated.has(i) || classesPending.has(i) || blocklist.has(i))
          return
        classesPending.add(i)
        changed = true
      })

    if (enablePreflight || !preflightOptions.enableAll) {
      // preflight
      Array.from(code.matchAll(regexHtmlTag))
        .forEach(([full, tag]) => {
          if (!tagsAvailable.has(tag))
            tag = preflightOptions.alias[kebabCase(tag)]
          if (preflightOptions.blocklist.has(tag))
            return
          if (tagsAvailable.has(tag) && !tagsPending.has(tag)) {
            tagsPending.add(tag)
            tagsAvailable.delete(tag)
            changed = true
          }
          if (tagsEnableAttrs[tag] && !attrsPending.has(full)) {
            attrsPending.add(full)
            changed = true
          }
        })
    }

    if (changed) {
      debug.detectClass(classesPending)
      debug.detectTag(tagsPending)
      debug.detectAttr(attrsPending)
    }

    return changed
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

    options.onBeforeGenerate?.({
      classesPending,
      tagsPending,
    })

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

    if (enablePreflight) {
      if (preflightOptions.enableAll || tagsPending.size) {
        const preflightStyle = processor.preflight(
          preflightOptions.enableAll
            ? undefined
            : [
              ...Array.from(tagsPending).map(i => `<${i}/>`),
              ...Array.from(attrsPending),
            ].join(' '),
          preflightOptions.includeBase,
          preflightOptions.includeGlobal,
          preflightOptions.includePlugin,
        )
        style = style.extend(preflightStyle, true)
        include(tagsGenerated, tagsPending)
        include(attrsGenerated, attrsPending)
        tagsPending.clear()
        attrsPending.clear()
        changed = true
      }
    }

    if (changed || !_cssCache) {
      if (sortUtilities)
        style.sort()

      _cssCache = style.build()

      options.onGenerated?.({
        classes: classesGenerated,
        tags: tagsGenerated,
      })
    }
    return _cssCache
  }

  function clearCache() {
    style = new StyleSheet()
    _cssCache = undefined

    include(classesPending, configSafelist)
    include(classesPending, safelist)
    include(classesPending, classesGenerated)

    include(tagsPending, tagsGenerated)
    include(tagsPending, preflightTags)
    include(tagsPending, preflightOptions.safelist)
    include(tagsAvailable, htmlTags as any as string[])

    exclude(tagsAvailable, preflightTags)
    exclude(tagsAvailable, preflightOptions.safelist)

    classesGenerated.clear()
    tagsGenerated.clear()
    attrsGenerated.clear()
    attrsPending.clear()
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
    transformGroups,
    transformGroupsWithSourcemap,
    isDetectTarget,
    isScanTarget,
    isCssTransformTarget,
    isExcluded,
    scan,

    files,
    globs,

    classesGenerated,
    classesPending,
    tagsGenerated,
    tagsPending,
    tagsAvailable,

    get scanned() {
      return scanned
    },
    get configFilePath() {
      return configFilePath
    },
    get hasPending() {
      return Boolean(tagsPending.size || classesPending.size)
    },
  }
}

export type WindiPluginUtils = ReturnType<typeof createUtils>
