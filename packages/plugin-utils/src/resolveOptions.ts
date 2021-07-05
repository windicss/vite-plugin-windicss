import path from 'path'
import _debug from 'debug'
import { loadConfiguration } from '@windicss/config'
import type { UserOptions, ResolvedOptions, WindiCssOptions, WindiPluginUtilsOptions } from './options'
import { defaultAlias } from './constants'
import { Arrayable, kebabCase, mergeArrays, slash, toArray } from './utils'
import { getDefaultExtractors } from './extractors/helper'

export * from '@windicss/config'

export function isResolvedOptions(options: UserOptions | ResolvedOptions): options is ResolvedOptions {
  // @ts-expect-error internal flag
  return options.__windi_resolved
}

function buildGlobs(dirs: Arrayable<string>, fileExtensions: Arrayable<string>) {
  dirs = toArray(dirs)
  const exts = toArray(fileExtensions)

  const globs = exts.length
    ? dirs.map(i =>
      path.posix.join(
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
  let { config, filepath: configFilePath } = loadConfigFile
    ? loadConfiguration({
      onConfigurationError: error => console.error(error),
      ...utilsOptions,
      root: utilsOptions.root || options.root,
      config: options.config,
      configFiles: options.configFiles,
    })
    : { config: {} as WindiCssOptions, filepath: undefined }

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
      fileExtensions: ['html', 'vue', 'md', 'mdx', 'pug', 'jsx', 'tsx', 'svelte', 'ts', 'js', 'css', 'postcss', 'pcss'],
      dirs: ['src'],
      exclude: [],
      include: [],
      runOnStartup: true,
      transformers: [],
      extractors: [],
      extraTransformTargets: {
        css: [],
        detect: [],
      },
    },
    typeof scan === 'boolean' ? {} : scan,
  )

  function resolveGlob(glob: string) {
    if (glob.startsWith('!'))
      return `!${slash(path.resolve(root, glob.slice(1)))}`
    return slash(path.resolve(root, glob))
  }

  scanOptions.exclude = mergeArrays(
    config.extract?.exclude,
    scanOptions.exclude,
    // only set default value when exclude is not provided
    config.extract?.exclude
      ? []
      : [
        'node_modules',
        '.git',
        'windi.config.{ts,js}',
        'tailwind.config.{ts,js}',
      ],
  )
    .map(resolveGlob)

  scanOptions.include = mergeArrays(
    config.extract?.include,
    scanOptions.include,
    // only set default value when include is not provided
    config.extract?.include ? [] : buildGlobs(scanOptions.dirs, scanOptions.fileExtensions),
  )
    .map(resolveGlob)

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
