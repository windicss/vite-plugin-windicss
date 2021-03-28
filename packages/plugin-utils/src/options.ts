/* eslint-disable no-use-before-define */

import type { Extractor, FullConfig as WindiCssOptions } from 'windicss/types/interfaces'
import { TransformerFunction } from './transformers'
import { TagNames } from './constants'

export { WindiCssOptions }

export interface UserOptions {
  /**
   * Options for windicss/tailwindcss.
   * Also accepts string as config file path.
   *
   * @default auto searching for `windi.config.ts` / `tailwind.config.js`
   */
  config?: WindiCssOptions | string

  /**
   * Safe class names to be always included.
   *
   * @deprecated define this field in the windicss.config.ts instead
   */
  safelist?: string | (string | string[])[]

  /**
   * Class names to be always excluded.
   *
   * @deprecated define this field in the windicss.config.ts instead
   */
  blocklist?: string | (string | string[])[]

  /**
   * Enabled windicss preflight (a.k.a TailwindCSS style reset)
   *
   * @deprecated define this field in the windicss.config.ts instead
   * @default true
   */
  preflight?: boolean | {
    /**
     * Enable all the preflight regardless the template
     *
     * @deprecated
     */
    enableAll?: boolean

    /**
     * Enable all the preflight regardless the template
     *
     * @deprecated define this field in the windicss.config.ts instead
     */
    includeAll?: boolean

    /**
     * Safelist to always included
     *
     * @deprecated define this field in the windicss.config.ts instead
     */
    safelist?: string | (string | string[])[]

    /**
     * Blocklist to always excluded
     *
     * @deprecated define this field in the windicss.config.ts instead
     */
    blocklist?: string | (string | string[])[]

    /**
      * Alias for resolving preflight
      */
    alias?: Record<string, TagNames>

    /**
     * @default true
     * @deprecated define this field in the windicss.config.ts instead
     */
    includeBase?: boolean

    /**
     * @default true
     * @deprecated define this field in the windicss.config.ts instead
     */
    includeGlobal?: boolean

    /**
     * @default true
     * @deprecated define this field in the windicss.config.ts instead
     */
    includePlugin?: boolean
  }

  /**
    * File paths will be resolved against this directory.
    *
    * @default process.cwd
    * @internal
    */
  root?: string

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
    dirs?: string | string[]

    /**
     * File extension to search for classnames
     *
     * @default 'html', 'vue', 'md', 'mdx', 'pug', 'jsx', 'tsx', 'svelte'
     */
    fileExtensions?: string | string[]

    /**
     * Exclude globs
     *
     * @default []
     */
    exclude?: string | string[]

    /**
     * Include globs
     *
     * @default []
     */
    include?: string | string[]

    /**
     * Transformers to apply before doing extraction
     *
     * @default []
     */
    transformers?: TransformerFunction[]
  }

  /**
   * Transform CSS for `@apply` directive
   *
   * @default true
   */
  transformCSS?: boolean | 'pre' | 'post'

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
   * Callback before classes css generated
   */
  onBeforeGenerate?: (ctx: { classesPending: Set<string>; tagsPending: Set<string> }) => void

  /**
   * Callback when classes and/or tags are generated/changed
   */
  onGenerated?: (ctx: { classes: Set<string>; tags: Set<string> }) => void

  /**
   * Callback when the options are resolved. These are the plugin options and contain the windi config
   */
  onOptionsResolved?: (options: ResolvedOptions) => ResolvedOptions | void | Promise<ResolvedOptions | void>

  /**
   * Callback when the windi config is resolved. Not to be confused with the options which are the top level way to
   * configure the util package
   */
  onConfigResolved?: (config: WindiCssOptions, configFilePath?: string) => WindiCssOptions | void | Promise<WindiCssOptions | void>
}

export interface WindiPluginUtilsOptions {
  /**
   * Name for debug
   *
   * @default 'windi-plugin-utils'
   * @internal
   */
  name?: string

  /**
    * CWD
    *
    * @default process.cwd
    * @internal
    */
  root?: string

  /**
   * Use sucrase/register to load configs in ESM/TypeScript
   *
   * @default true
   */
  enableSucrase?: boolean
}

export interface ResolvedOptions {
  config: WindiCssOptions
  configFilePath: string | undefined

  enableScan: boolean
  enablePreflight: boolean
  transformCSS: boolean | 'pre' | 'auto' | 'post'
  transformGroups: boolean

  scanOptions: {
    fileExtensions: string[]
    dirs: string[]
    exclude: string[]
    include: string[]
    runOnStartup: boolean
    transformers: TransformerFunction[]
    extractors: Extractor[]
  }

  preflightOptions: {
    includeBase: boolean
    includeGlobal: boolean
    includePlugin: boolean
    includeAll: boolean
    /**
     * @deprecated use includeAll
     */
    enableAll: boolean
    safelist: Set<string>
    blocklist: Set<string>
    alias: Record<string, string>
  }

  root: string
  sortUtilities: boolean
  safelist: Set<string>
  blocklist: Set<string>
  onBeforeGenerate: UserOptions['onBeforeGenerate']
  onGenerated: UserOptions['onGenerated']
  onConfigResolved: UserOptions['onConfigResolved']
  onOptionsResolved: UserOptions['onOptionsResolved']
}
