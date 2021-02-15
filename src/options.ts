import type { Config as WindiCssOptions } from 'windicss/types/interfaces'
import { defaultAlias, TagNames } from './constants'
import { kebabCase } from './utils'

export { WindiCssOptions }

export interface UserOptions {
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
}

export function resolveOptions(options: UserOptions) {
  const {
    windicssOptions = 'tailwind.config.js',
    searchExtensions = ['html', 'vue', 'md', 'pug', 'jsx', 'tsx', 'svelte'],
    searchDirs = ['src'],
    searchExclude = [],
    preflight = true,
    transformCSS = true,
    sortUtilities = true,
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

  preflightOptions.alias = Object.fromEntries(
    Object.entries({
      ...defaultAlias,
      ...preflightOptions.alias,
    }).filter(([k, v]) => [kebabCase(k), v]),
  )

  return {
    windicssOptions,
    searchExtensions,
    searchDirs,
    searchExclude,
    transformCSS,
    preflight: Boolean(preflight),
    preflightOptions,
    sortUtilities,
  }
}

export type ResolvedOptions = ReturnType<typeof resolveOptions>
