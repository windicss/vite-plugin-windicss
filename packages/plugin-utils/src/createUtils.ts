import { promises as fs } from 'fs'
import WindiCssProcessor from 'windicss'
import { StyleSheet } from 'windicss/utils/style'
import { CSSParser } from 'windicss/utils/parser'
import { generateCompletions } from 'windicss/utils'
import fg from 'fast-glob'
import _debug from 'debug'
import micromatch from 'micromatch'
import { preflightTags, htmlTags } from './constants'
import { WindiPluginUtilsOptions, UserOptions, ResolvedOptions } from './options'
import { resolveOptions } from './resolveOptions'
import { kebabCase, include, exclude, slash, transformGroups, transformGroupsWithSourcemap } from './utils'
import { applyExtractors as _applyExtractors } from './extractors/helper'

export type CompletionsResult = ReturnType<typeof generateCompletions>

export function createUtils(
  userOptions: UserOptions | ResolvedOptions = {},
  utilsOptions: WindiPluginUtilsOptions = {
    name: 'windicss-plugin-utils',
  },
) {
  let options = {} as ResolvedOptions

  const name = utilsOptions.name
  const debug = {
    config: _debug(`${name}:config`),
    debug: _debug(`${name}:debug`),
    compile: _debug(`${name}:compile`),
    glob: _debug(`${name}:scan:glob`),
    scanTransform: _debug(`${name}:scan:transform`),
    detectClass: _debug(`${name}:detect:class`),
    detectTag: _debug(`${name}:detect:tag`),
  }

  let processor: WindiCssProcessor
  let completions: CompletionsResult | undefined

  let files: string[] = []

  let regexId: RegExp

  const classesGenerated = new Set<string>()
  const classesPending = new Set<string>()
  const tagsGenerated = new Set<string>()
  const tagsPending = new Set<string>()
  const attrsGenerated = new Set<string>()
  const tagsAvailable = new Set<string>()

  async function init() {
    options = await resolveOptions(userOptions, utilsOptions, true)
    regexId = new RegExp(`\\.(?:${options.scanOptions.fileExtensions.join('|')})$`, 'i')
    files = []

    processor = new WindiCssProcessor(options.config)
    clearCache()
    return processor
  }

  async function ensureInit() {
    if (!processor)
      return await init()
  }

  function getCompletions() {
    if (!completions)
      completions = generateCompletions(processor)
    return completions
  }

  async function getFiles() {
    const files = await fg(
      options.scanOptions.include,
      {
        cwd: options.root,
        ignore: options.scanOptions.exclude,
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
    await ensureInit()
    if (!_searching) {
      _searching = (async() => {
        files.push(...await getFiles())

        const contents = await Promise.all(
          files
            .filter(id => isDetectTarget(id))
            .map(async id => [await fs.readFile(id, 'utf-8'), id]),
        )

        await Promise.all(contents.map(
          ([content, id]) => extractFile(content, id, true),
        ))

        scanned = true
      })()
    }

    return _searching
  }

  function isExcluded(id: string) {
    return id.match(/\b(?:node_modules|.git)\b/)
      || micromatch.isMatch(slash(id), options.scanOptions.exclude)
  }

  function isDetectTarget(id: string) {
    if (files.some(file => id.startsWith(file)))
      return true
    return id.match(regexId) && !isExcluded(id)
  }

  function isScanTarget(id: string) {
    return options.enableScan
      ? files.some(file => id.startsWith(file))
      : isDetectTarget(id)
  }

  function isCssTransformTarget(id: string) {
    if (id.match(/\.(?:postcss|scss|sass|css|stylus|less)(?:$|\?)/i) && !isExcluded(id))
      return true
    return false
  }

  function addClasses(classes: string[]) {
    let changed = false
    classes.forEach((i) => {
      if (!i || classesGenerated.has(i) || classesPending.has(i) || options.blocklist.has(i))
        return
      classesPending.add(i)
      changed = true
    })
    return changed
  }
  function addTags(tags: string[]) {
    let changed = false
    tags.forEach((tag) => {
      if (!tagsAvailable.has(tag))
        tag = options.preflightOptions.alias[kebabCase(tag)]
      if (options.preflightOptions.blocklist.has(tag))
        return
      if (tagsAvailable.has(tag) && !tagsPending.has(tag)) {
        tagsPending.add(tag)
        tagsAvailable.delete(tag)
        changed = true
      }
    })
    return changed
  }

  async function applyExtractors(code: string, id?: string) {
    return await _applyExtractors(code, id, options.scanOptions.extractors)
  }

  async function extractFile(code: string, id?: string, applyGroupTransform = true) {
    if (applyGroupTransform) {
      if (options.transformGroups)
        code = transformGroups(code)
    }

    if (id) {
      debug.scanTransform(id)
      for (const trans of options.scanOptions.transformers) {
        const result = trans(code, id)
        if (result != null)
          code = result
      }
    }

    const { classes, tags } = await applyExtractors(code, id)

    let changed = false
    // classes
    changed = addClasses(classes || []) || changed

    if (options.enablePreflight || !options.preflightOptions.includeAll) {
      // preflight
      changed = addTags(tags || []) || changed
    }

    if (changed) {
      debug.detectClass(classesPending)
      debug.detectTag(tagsPending)
    }

    return changed
  }

  function transformCSS(css: string) {
    if (!options.transformCSS)
      return css
    const style = new CSSParser(css, processor).parse()
    return style.build()
  }

  let style: StyleSheet = new StyleSheet()
  let _cssCache: string | undefined

  async function generateCSS() {
    await ensureInit()

    if (options.enableScan && options.scanOptions.runOnStartup)
      await scan()

    options.onBeforeGenerate?.({
      classesPending,
      tagsPending,
    })

    let changed = false

    if (classesPending.size) {
      const result = processor.interpret(Array.from(classesPending).join(' '))
      if (result.success.length) {
        debug.compile(`compiled ${result.success.length} classes out of ${classesPending.size}`)
        debug.compile(result.success)
        include(classesGenerated, result.success)
        classesPending.clear()

        style = style.extend(result.styleSheet)
        changed = true
      }
    }

    if (options.enablePreflight) {
      if (options.preflightOptions.includeAll || tagsPending.size) {
        const preflightStyle = processor.preflight(
          options.preflightOptions.includeAll
            ? undefined
            : Array.from(tagsPending).map(i => `<${i}/>`).join(' '),
          options.preflightOptions.includeBase,
          options.preflightOptions.includeGlobal,
          options.preflightOptions.includePlugin,
        )
        style = style.extend(preflightStyle, true)
        include(tagsGenerated, tagsPending)
        tagsPending.clear()
        changed = true
      }
    }

    if (changed || !_cssCache) {
      if (options.sortUtilities)
        style.sort()

      _cssCache = style.build()

      options.onGenerated?.({
        classes: classesGenerated,
        tags: tagsGenerated,
      })
    }

    return _cssCache
  }

  function clearCache(clearAll = false) {
    style = new StyleSheet()
    _cssCache = undefined
    completions = undefined

    if (clearAll) {
      classesPending.clear()
      tagsPending.clear()
      tagsAvailable.clear()
    }
    else {
      include(classesPending, options.safelist)
      include(classesPending, classesGenerated)

      include(tagsPending, tagsGenerated)
      include(tagsPending, preflightTags)
      include(tagsPending, options.preflightOptions.safelist)
      include(tagsAvailable, htmlTags as any as string[])
    }

    exclude(tagsAvailable, preflightTags)
    exclude(tagsAvailable, options.preflightOptions.safelist)

    classesGenerated.clear()
    tagsGenerated.clear()
    attrsGenerated.clear()
  }

  return {
    init,
    ensureInit,
    extractFile,
    applyExtractors,
    generateCSS,
    getFiles,
    clearCache,
    transformCSS,
    transformGroups,
    transformGroupsWithSourcemap,
    isDetectTarget,
    isScanTarget,
    isCssTransformTarget,
    isExcluded,
    scan,

    classesGenerated,
    classesPending,
    tagsGenerated,
    tagsPending,
    tagsAvailable,

    addClasses,
    addTags,
    getCompletions,

    get initialized() {
      return !!processor
    },
    get options() {
      return options
    },
    get files() {
      return files
    },
    get globs() {
      return options.scanOptions.include
    },
    get processor() {
      return processor
    },
    get scanned() {
      return scanned
    },
    get configFilePath() {
      return options.configFilePath
    },
    get hasPending() {
      return Boolean(tagsPending.size || classesPending.size)
    },
  }
}

export type WindiPluginUtils = ReturnType<typeof createUtils>
