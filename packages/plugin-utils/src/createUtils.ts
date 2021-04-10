import { promises as fs } from 'fs'
import { StyleSheet } from 'windicss/utils/style'
import { CSSParser } from 'windicss/utils/parser'
import { generateCompletions } from 'windicss/utils'
import fg from 'fast-glob'
import _debug from 'debug'
import micromatch from 'micromatch'
import Processor from 'windicss'
import { preflightTags, htmlTags } from './constants'
import { WindiPluginUtilsOptions, UserOptions, ResolvedOptions } from './options'
import { resolveOptions } from './resolveOptions'
import { kebabCase, include, exclude, slash, transformGroups, transformGroupsWithSourcemap } from './utils'
import { applyExtractors as _applyExtractors } from './extractors/helper'

export type CompletionsResult = ReturnType<typeof generateCompletions>
export type LayerName = 'base' | 'utilities' | 'components'

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

  let processor: Processor
  let completions: CompletionsResult | undefined

  let files: string[] = []

  const classesGenerated = new Set<string>()
  const classesPending = new Set<string>()
  const tagsGenerated = new Set<string>()
  const tagsPending = new Set<string>()
  const attrsGenerated = new Set<string>()
  const tagsAvailable = new Set<string>()

  function getCompletions() {
    if (!completions)
      completions = generateCompletions(processor)
    return completions
  }

  async function getFiles() {
    await ensureInit()
    debug.glob('include', options.scanOptions.include)
    debug.glob('exclude', options.scanOptions.exclude)

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
    return micromatch.isMatch(slash(id), options.scanOptions.exclude, { dot: true })
  }

  function isIncluded(id: string) {
    return micromatch.isMatch(slash(id), options.scanOptions.include)
  }

  function isDetectTarget(id: string) {
    if (files.includes(id) || files.includes(id.slice(0, id.indexOf('?'))))
      return true
    id = slash(id)
    return isIncluded(id) && !isExcluded(id)
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

  let layers: Record<LayerName, StyleSheet> = {
    base: new StyleSheet(),
    utilities: new StyleSheet(),
    components: new StyleSheet(),
  }

  let _layersCssCache: Record<LayerName, string> | undefined

  function updateLayers(style: StyleSheet) {
    for (const s of style.children)
      layers[s.meta.type].children.push(s)
  }

  async function generateCSS(layer?: LayerName) {
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

        updateLayers(result.styleSheet)
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
        updateLayers(preflightStyle)
        include(tagsGenerated, tagsPending)
        tagsPending.clear()
        changed = true
      }
    }

    if (changed || !_layersCssCache) {
      if (options.sortUtilities)
        Object.values(layers).map(l => l.sort())

      _layersCssCache = {
        base: layers.base.build(),
        utilities: layers.utilities.build(),
        components: layers.components.build(),
      }

      options.onGenerated?.({
        classes: classesGenerated,
        tags: tagsGenerated,
      })
    }

    return layer
      ? _layersCssCache[layer]
      : [
        _layersCssCache.base,
        _layersCssCache.components,
        _layersCssCache.utilities,
      ].join('\n\n')
  }

  function clearCache(clearAll = false) {
    layers = {
      base: new StyleSheet(),
      utilities: new StyleSheet(),
      components: new StyleSheet(),
    }
    _layersCssCache = undefined
    completions = undefined

    if (clearAll) {
      classesPending.clear()
      tagsPending.clear()
      tagsAvailable.clear()
    }
    else {
      include(classesPending, classesGenerated)

      include(tagsPending, tagsGenerated)
      include(tagsPending, preflightTags)
      include(tagsAvailable, htmlTags as any as string[])
    }

    include(classesPending, options.safelist)
    include(tagsPending, options.preflightOptions.safelist)

    exclude(tagsAvailable, preflightTags)
    exclude(tagsAvailable, options.preflightOptions.safelist)

    classesGenerated.clear()
    tagsGenerated.clear()
    attrsGenerated.clear()
  }

  const utils = {
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

  async function _init() {
    options = await resolveOptions(userOptions, utilsOptions, true)
    files = []

    processor = new Processor(options.config)
    clearCache(false)

    options.onInitialized?.(utils)

    return processor
  }

  // ensure only init once with `ensureInit`
  let _promise_init: Promise<Processor> | undefined

  async function init() {
    _promise_init = _init()
    return _promise_init
  }

  async function ensureInit(): Promise<Processor> {
    if (processor)
      return processor
    if (!_promise_init)
      _promise_init = _init()
    return _promise_init
  }

  return utils
}

export type WindiPluginUtils = ReturnType<typeof createUtils>
