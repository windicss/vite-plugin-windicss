/* eslint-disable no-use-before-define */

import type { Config as WindiCssOptions } from 'windicss/types/interfaces'
import { defaultAlias, TagNames } from './constants'
import { kebabCase, toArray } from './utils'

export { WindiCssOptions }

export interface WindiBoxOptions {
  /**
   * Name for debug
   *
   * @default 'windi-box'
   */
  name?: string

  /**
   * Options for windicss/tailwindcss.
   * Also accepts string as config file path.
   *
   * @default 'tailwind.config.js'
   */
  windicssOptions?: WindiCssOptions | string

  /**
   * Enabled windicss preflight (a.k.a TailwindCSS style reset)
   *
   * @default true
   */
  preflight?: boolean | {
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
   * Directories to search for classnames
   *
   * @default 'src'
   */
  searchDirs?: string[]

  /**
   * File extension to search for classnames
   *
   * @default 'html', 'vue'
   */
  searchExtensions?: string[]

  /**
   * Exclude globs
   *
   * @default []
   */
  searchExclude?: string[]

  /**
   * Transform CSS for `@apply` directive
   *
   * @default true
   */
  transformCSS?: boolean

  /**
   * Sort the genrate utilities
   *
   * @default true
   */
  sortUtilities?: boolean

  /**
   * Safe class names to be always included.
   */
  safelist?: string | string[]

  /**
   * CWD
   *
   * @default process.cwd
   */
  root?: string
}

export function resolveOptions(options: WindiBoxOptions) {
  const {
    windicssOptions = 'tailwind.config.js',
    searchExtensions = ['html', 'vue', 'md', 'pug', 'jsx', 'tsx', 'svelte'],
    searchDirs = ['src'],
    searchExclude = [],
    preflight = true,
    transformCSS = true,
    sortUtilities = true,
    root = process.cwd(),
  } = options

  const preflightOptions = Object.assign(
    {
      includeBase: true,
      includeGlobal: true,
      includePlugin: true,
      alias: {},
    },
    typeof preflight === 'boolean' ? {} : preflight,
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
    windicssOptions,
    searchExtensions,
    searchDirs,
    searchExclude,
    transformCSS,
    preflight: Boolean(preflight),
    preflightOptions,
    sortUtilities,
    safelist,
    root,
  }
}

export type ResolvedOptions = ReturnType<typeof resolveOptions>
