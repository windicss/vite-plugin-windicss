/* eslint-disable no-use-before-define */

import type { Config as WindiCssOptions } from 'windicss/types/interfaces'
import { defaultAlias, TagNames } from './constants'
import { kebabCase, toArray } from './utils'

export { WindiCssOptions }

export interface WindiPluginUtilsOptions {
  /**
   * Options for windicss/tailwindcss.
   * Also accepts string as config file path.
   *
   * @default 'tailwind.config.js'
   */
  config?: WindiCssOptions | string

  /**
   * Safe class names to be always included.
   */
  safelist?: string | string[]

  /**
   * Enabled windicss preflight (a.k.a TailwindCSS style reset)
   *
   * @default true
   */
  preflight?: boolean | {
    /**
     * Enable all the preflight regardless the template
     */
    enableAll?: boolean

    /**
     * Safelist to always included
     */
    safelist?: string | string[]

    /**
      * Alias for resolving preflight
      */
    alias?: Record<string, TagNames>

    /**
     * @default true
     */
    includeBase?: boolean

    /**
     * @default true
     */
    includeGlobal?: boolean

    /**
     * @default true
     */
    includePlugin?: boolean
  }

  /**
   * Scan the files and extract the usage
   *
   * @default true
   */
  scan?: boolean | {
    /**
     * Auto scan on startup
     *
     * @default true
     */
    runOnStartup?: boolean

    /**
     * Directories to search for classnames
     *
     * @default 'src'
     */
    dirs?: string[]

    /**
     * File extension to search for classnames
     *
     * @default 'html', 'vue'
     */
    fileExtensions?: string[]

    /**
     * Exclude globs
     *
     * @default []
     */
    exclude?: string[]

    /**
     * Include globs
     *
     * @default []
     */
    include?: string[]
  }

  /**
   * Transform CSS for `@apply` directive
   *
   * @default true
   */
  transformCSS?: boolean

  /**
   * Transform groups like `hover:(bg-gray-100 font-medium)`
   *
   * @default true
   */
  transformGroups?: boolean

  /**
   * Sort the genrate utilities
   *
   * @default true
   */
  sortUtilities?: boolean

  /**
   * Name for debug
   *
   * @default 'windi-plugin-utils'
   * @internal
   */
  _pluginName?: string

  /**
   * CWD
   *
   * @default process.cwd
   * @internal
   */
  _projectRoot?: string
}

export type UserOptions = Omit<WindiPluginUtilsOptions, '_pluginName' | '_projectRoot'>

export function resolveOptions(options: WindiPluginUtilsOptions) {
  const {
    config = 'tailwind.config.js',
    scan = true,
    preflight = true,
    transformCSS = true,
    sortUtilities = true,
    _projectRoot = process.cwd(),
    _pluginName = 'windi-plugin-utils',
  } = options

  const preflightOptions = Object.assign(
    {
      includeBase: true,
      includeGlobal: true,
      includePlugin: true,
      enableAll: false,
      alias: {},
    },
    typeof preflight === 'boolean' ? {} : preflight,
  )

  const scanOptions = Object.assign(
    {
      fileExtensions: ['html', 'vue', 'md', 'pug', 'jsx', 'tsx', 'svelte'],
      dirs: ['src'],
      exclude: [] as string[],
      include: [] as string[],
      runOnStartup: true,
    },
    typeof scan === 'boolean' ? {} : scan,
  )

  const safelist = new Set(toArray(options.safelist || []).flatMap(i => i.split(' ')))

  preflightOptions.alias = Object.fromEntries(
    Object.entries({
      ...defaultAlias,
      ...preflightOptions.alias,
    }).filter(([k, v]) => [kebabCase(k), v]),
  )

  return {
    ...options,
    _projectRoot,
    _pluginName,
    config,
    scan: Boolean(scan),
    scanOptions,
    preflight: Boolean(preflight),
    preflightOptions,
    transformCSS,
    sortUtilities,
    safelist,
  }
}

export type ResolvedOptions = ReturnType<typeof resolveOptions>
