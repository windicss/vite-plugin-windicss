import { existsSync } from 'fs'
import { resolve, posix } from 'path'
import _debug from 'debug'
import type { UserOptions, ResolvedOptions, WindiCssOptions, WindiPluginUtilsOptions } from './options'
import { defaultAlias, configureFiles } from './constants'
import { Arrayable, kebabCase, mergeArrays, toArray } from './utils'
import { registerSucrase } from './register'
import { getDefaultExtractors } from './extractors/helper'

export function isResolvedOptions(options: UserOptions | ResolvedOptions): options is ResolvedOptions {
  // @ts-expect-error internal flag
  return options.__windi_resolved
}

function buildGlobs(dirs: Arrayable<string>, fileExtensions: Arrayable<string>) {
  dirs = toArray(dirs)
  const exts = toArray(fileExtensions)

  const globs = exts.length
    ? dirs.map(i =>
      posix.join(
        i,
        exts.length > 1
          ? `**/*.{${exts.join(',')}}`
          : `**/*.${exts[0]}`,
      ),
    )
    : []

  globs.push('index.html')

  return globs
}

export async function resolveOptions(
  options: UserOptions | ResolvedOptions = {},
  utilsOptions: WindiPluginUtilsOptions = {},
  loadConfigFile = false,
): Promise<ResolvedOptions> {
  if (isResolvedOptions(options))
    return options

  const {
    name = 'windicss-plugin-utils',
  } = utilsOptions

  const debugOptions = _debug(`${name}:options`)

  const { resolved: config, configFilePath } = loadConfigFile
    ? await loadConfiguration(options, utilsOptions)
    : { resolved: {} as WindiCssOptions, configFilePath: {} }

  const {
    root = utilsOptions.root || process.cwd(),
    scan = true,
    preflight = true,
    transformCSS = true,
    transformGroups = true,
    sortUtilities = true,
  } = options

  const preflightOptions: ResolvedOptions['preflightOptions'] = Object.assign(
    {
      includeBase: true,
      includeGlobal: true,
      includePlugin: true,
      enableAll: false,
      includeAll: false,
      safelist: [],
      blocklist: [],
      alias: {},
    },
    typeof config.preflight === 'boolean' ? {} : config.preflight,
    typeof preflight === 'boolean' ? {} : preflight,
  ) as unknown as ResolvedOptions['preflightOptions']

  // backward compatibility
  preflightOptions.includeAll = preflightOptions.includeAll || preflightOptions.enableAll

  const scanOptions: ResolvedOptions['scanOptions'] = Object.assign(
    {
      fileExtensions: ['html', 'vue', 'md', 'mdx', 'pug', 'jsx', 'tsx', 'svelte'],
      dirs: ['src'],
      exclude: ['node_modules', '.git'],
      include: [],
      runOnStartup: true,
      transformers: [],
      extractors: [],
    },
    typeof scan === 'boolean' ? {} : scan,
  )

  scanOptions.exclude = mergeArrays(config.extract?.exclude, scanOptions.exclude)
    .map(i => resolve(root, i))
  scanOptions.include = mergeArrays(
    config.extract?.include,
    scanOptions.include,
    config.extract?.include ? [] : buildGlobs(scanOptions.dirs, scanOptions.fileExtensions),
  )
    .map(i => resolve(root, i))
  scanOptions.extractors = mergeArrays(getDefaultExtractors(), config.extract?.extractors)

  const safelist = new Set(mergeArrays(config.safelist, options.safelist).flatMap(i => i.split(' ')))
  const blocklist = new Set(mergeArrays(config.blocklist, options.blocklist).flatMap(i => i.split(' ')))

  // preflightOptions from config file
  const configPreflightOptions = typeof config.preflight === 'boolean' ? {} : config.preflight || {}

  preflightOptions.safelist = new Set<string>(
    mergeArrays(
      configPreflightOptions?.safelist,
      Array.from(preflightOptions.safelist),
    )
      .flatMap(i => i.split(' '))
      .map((i) => {
        // selector
        const match = i.match(/^\[(.*?)\]$/)?.[1]
        if (match)
          return `div ${match}`
        return i
      }))

  preflightOptions.blocklist = new Set<string>(
    mergeArrays(
      configPreflightOptions?.blocklist,
      Array.from(preflightOptions.blocklist),
    )
      .flatMap(i => i.split(' ')),
  )

  preflightOptions.alias = Object.fromEntries(
    Object
      .entries({
        ...defaultAlias,
        ...configPreflightOptions.alias,
        ...preflightOptions.alias,
      })
      .filter(([k, v]) => [kebabCase(k), v]),
  )

  let resolvedOptions = {
    ...options,
    root,
    config,
    configFilePath,
    enableScan: Boolean(scan),
    scanOptions,
    enablePreflight: config.preflight !== false && Boolean(preflight),
    preflightOptions,
    transformCSS,
    transformGroups,
    sortUtilities,
    safelist,
    blocklist,
    __windi_resolved: true,
  } as ResolvedOptions

  // allow the resolved options to be overwritten
  const modifiedOptions = await resolvedOptions.onOptionsResolved?.(resolvedOptions)
  if (modifiedOptions != null && modifiedOptions !== resolvedOptions)
    resolvedOptions = Object.assign(resolvedOptions, modifiedOptions)

  debugOptions(resolvedOptions)

  return resolvedOptions
}

export async function loadConfiguration(options: UserOptions, utilsOptions: WindiPluginUtilsOptions) {
  let resolved: WindiCssOptions = {}
  let configFilePath: string | undefined
  let error: Error | undefined

  const {
    name = 'windicss-plugin-utils',
    enableSucrase = true,
  } = utilsOptions

  const debugConfig = _debug(`${name}:config`)

  const {
    config,
    root = utilsOptions.root || process.cwd(),
  } = options

  if (typeof config === 'string' || !config) {
    if (!config) {
      for (const name of configureFiles) {
        const tryPath = resolve(root, name)
        if (existsSync(tryPath)) {
          configFilePath = tryPath
          break
        }
      }
    }
    else {
      configFilePath = resolve(root, config)
      if (!existsSync(configFilePath)) {
        console.warn(`[${name}] config file "${config}" not found, ignored`)
        configFilePath = undefined
      }
    }

    if (configFilePath) {
      let revert = () => {}
      try {
        debugConfig('loading from ', configFilePath)

        if (enableSucrase)
          revert = registerSucrase()

        delete require.cache[require.resolve(configFilePath)]
        resolved = require(configFilePath)
        if (resolved.default)
          resolved = resolved.default
      }
      catch (e) {
        console.error(`[${name}] failed to load config "${configFilePath}"`)
        console.error(`[${name}] ${e.toString()}`)
        error = e
        configFilePath = undefined
        resolved = {}
      }
      finally {
        revert()
      }
    }
  }
  else {
    resolved = config
  }

  // allow to hook into resolved config
  const modifiedConfigs = await options.onConfigResolved?.(resolved, configFilePath)
  if (modifiedConfigs != null)
    resolved = modifiedConfigs

  debugConfig(resolved)

  return {
    error,
    resolved,
    configFilePath,
  }
}
