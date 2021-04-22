import { existsSync, promises as fs } from 'fs'
import { resolve, posix } from 'path'
import { pathToFileURL } from 'url'
import _debug from 'debug'
import type { UserOptions, ResolvedOptions, WindiCssOptions, WindiPluginUtilsOptions } from './options'
import { defaultAlias, defaultConfigureFiles } from './constants'
import { Arrayable, kebabCase, mergeArrays, slash, toArray } from './utils'
import { HookOptions, registerSucrase } from './register'
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

  // eslint-disable-next-line prefer-const
  let { resolved: config, configFilePath } = loadConfigFile
    ? await loadConfiguration({
      ...utilsOptions,
      root: utilsOptions.root || options.root,
      config: options.config,
    })
    : { resolved: {} as WindiCssOptions, configFilePath: undefined }

  // allow to hook into resolved config
  const modifiedConfigs = await options.onConfigResolved?.(config, configFilePath)
  if (modifiedConfigs != null)
    config = modifiedConfigs

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
      fileExtensions: ['html', 'vue', 'md', 'mdx', 'pug', 'jsx', 'tsx', 'svelte', 'ts', 'js', 'css', 'postcss'],
      dirs: ['src'],
      exclude: [],
      include: [],
      runOnStartup: true,
      transformers: [],
      extractors: [],
    },
    typeof scan === 'boolean' ? {} : scan,
  )

  scanOptions.exclude = mergeArrays(
    config.extract?.exclude,
    scanOptions.exclude,
    // only set default value when exclude is not provided
    config.extract?.exclude ? [] : ['node_modules', '.git'],
  )
    .map(i => slash(resolve(root, i)))

  scanOptions.include = mergeArrays(
    config.extract?.include,
    scanOptions.include,
    // only set default value when include is not provided
    config.extract?.include ? [] : buildGlobs(scanOptions.dirs, scanOptions.fileExtensions),
  )
    .map(i => slash(resolve(root, i)))

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

export interface LoadConfigurationOptions {
  /**
   * Name for debug
   *
   * @default 'windi-plugin-utils'
   * @internal
   */
  name?: string
  /**
   * Use sucrase/register to load configs in ESM/TypeScript
   *
   * @default true
   */
  enableSucrase?: boolean
  /**
   * Options for https://github.com/ariporad/pirates
   */
  hookOptions?: HookOptions
  /**
   * Config object or path
   */
  config?: WindiCssOptions | string
  /**
   * CWD
   *
   * @default process.cwd
   * @internal
   */
  root?: string
  /**
   * A list of filename of paths to search of config files
   */
  configFiles?: string[]
  /**
   * On loading configuration error
   */
  onConfigurationError?: (error: Error) => void
}

export async function loadConfiguration(options: LoadConfigurationOptions) {
  let resolved: WindiCssOptions = {}
  let configFilePath: string | undefined
  let error: Error | undefined

  const {
    name = 'windicss-plugin-utils',
    enableSucrase = true,
    config,
    root = process.cwd(),
    configFiles: configureFiles = defaultConfigureFiles,
    onConfigurationError = e => console.error(e),
    hookOptions,
  } = options

  const debugConfig = _debug(`${name}:config`)

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
      let revert = () => { }
      try {
        debugConfig('loading from ', configFilePath)

        const isEsmJS = configFilePath.endsWith('.js')
          && (await fs.readFile(configFilePath, 'utf-8')).includes('export default ')

        if (enableSucrase)
          revert = registerSucrase(hookOptions)

        if (isEsmJS) {
          // hack to prevent `import` get transformed
          // eslint-disable-next-line no-new-func
          const _import = new Function('modulePath', 'return import(modulePath)')

          if (typeof require !== 'undefined')
            delete require.cache[require.resolve(configFilePath)]

          resolved = (await _import(pathToFileURL(configFilePath)))?.default || {}

          if (resolved.default)
            resolved = resolved.default
        }
        else {
          delete require.cache[require.resolve(configFilePath)]
          resolved = require(configFilePath)
          if (resolved.default)
            resolved = resolved.default
        }
      }
      catch (e) {
        error = e
        configFilePath = undefined
        resolved = {}
        onConfigurationError?.(e)
      }
      finally {
        revert()
      }
    }
  }
  else {
    resolved = config
  }

  debugConfig(resolved)

  return {
    error,
    resolved,
    configFilePath,
  }
}
