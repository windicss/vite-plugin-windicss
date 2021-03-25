import { promises as fs } from 'fs'
import WindiCssProcessor from 'windicss'
import { StyleSheet } from 'windicss/utils/style'
import { CSSParser } from 'windicss/utils/parser'
import { generateCompletions } from 'windicss/utils'
import fg from 'fast-glob'
import _debug from 'debug'
import micromatch from 'micromatch'
import { preflightTags, htmlTags } from './constants'
import { regexQuotedString, regexClassSplitter, regexClassCheck, regexHtmlTag } from './regexes'
import { WindiPluginUtilsOptions, UserOptions, ResolvedOptions } from './options'
import { resolveOptions } from './resolveOptions'
import { kebabCase, include, exclude, slash, transformGroups, transformGroupsWithSourcemap } from './utils'

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

  function init() {
    completions = undefined

    options = resolveOptions(userOptions, utilsOptions, true)
    regexId = new RegExp(`\\.(?:${options.scanOptions.fileExtensions.join('|')})$`, 'i')
    files = []

    processor = new WindiCssProcessor(options.config)
    clearCache()
    return processor
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
    if (!processor)
      init()
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

  function extractFile(code: string, id?: string, applyGroupTransform = true) {
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

    let changed = false
    // classes
    changed = addClasses(
      Array.from(code.matchAll(regexQuotedString))
        .flatMap(m => (m[2] || '').split(regexClassSplitter))
        .filter(i => i.match(regexClassCheck)),
    ) || changed

    if (options.enablePreflight || !options.preflightOptions.enableAll) {
      // preflight
      changed = addTags(
        Array.from(code.matchAll(regexHtmlTag))
          .map(i => i[1]),
      ) || changed
    }

    if (changed) {
      debug.detectClass(classesPending)
      debug.detectTag(tagsPending)
    }

    return changed
  }

  function transformCSS(css: string) {
    if (!processor)
      init()
    if (!options.transformCSS)
      return css
    const style = new CSSParser(css, processor).parse()
    return style.build()
  }

  let style: StyleSheet = new StyleSheet()
  let _cssCache: string | undefined

  async function generateCSS() {
    if (!processor)
      init()

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
        include(classesGenerated, result.success)
        classesPending.clear()
        debug.compile(`compiled ${result.success.length} classes`)
        debug.compile(result.success)

        style = style.extend(result.styleSheet)
        changed = true
      }
    }

    if (options.enablePreflight) {
      if (options.preflightOptions.enableAll || tagsPending.size) {
        const preflightStyle = processor.preflight(
          options.preflightOptions.enableAll
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

  function clearCache() {
    style = new StyleSheet()
    _cssCache = undefined

    include(classesPending, options.safelist)
    include(classesPending, classesGenerated)

    include(tagsPending, tagsGenerated)
    include(tagsPending, preflightTags)
    include(tagsPending, options.preflightOptions.safelist)
    include(tagsAvailable, htmlTags as any as string[])

    exclude(tagsAvailable, preflightTags)
    exclude(tagsAvailable, options.preflightOptions.safelist)

    classesGenerated.clear()
    tagsGenerated.clear()
    attrsGenerated.clear()
  }

  return {
    init,
    extractFile,
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
