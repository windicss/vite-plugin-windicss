/* eslint-disable no-use-before-define */

import type { Config as WindiCssOptions } from 'windicss/types/interfaces'
import { PugTransformer, TransformerFunction } from './transformers'
import { defaultAlias, TagNames } from './constants'
import { kebabCase, toArray } from './utils'

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
   */
  safelist?: string | string[]

  /**
   * Class names to be always excluded.
   */
  blocklist?: string | string[]

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
     * Blocklist to always excluded
     */
    blocklist?: string | string[]

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
    dirs?: string[]

    /**
     * File extension to search for classnames
     *
     * @default 'html', 'vue', 'md', 'mdx', 'pug', 'jsx', 'tsx', 'svelte'
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
   * Use esbuild-register to load configs in TypeScript
   *
   * @default true
   */
  enabledTypeScriptConfig?: boolean
}

export interface ResolvedOptions {
  config: string | WindiCssOptions | undefined
  scan: boolean
  scanOptions: {
    fileExtensions: string[]
    dirs: string[]
    exclude: string[]
    include: string[]
    runOnStartup: boolean
    transformers: TransformerFunction[]
  }
  preflight: boolean
  preflightOptions: {
    includeBase: boolean
    includeGlobal: boolean
    includePlugin: boolean
    enableAll: boolean
    safelist: Set<string>
    blocklist: Set<string>
    alias: Record<string, TagNames>
  }
  root: string
  transformCSS: boolean | 'pre' | 'auto' | 'post'
  transformGroups: boolean
  sortUtilities: boolean
  safelist: Set<string>
  blocklist: Set<string>
  onBeforeGenerate: UserOptions['onBeforeGenerate']
  onGenerated: UserOptions['onGenerated']
}

function isResolvedOptions(options: UserOptions | ResolvedOptions): options is ResolvedOptions {
  // @ts-expect-error internal flag
  return options.__windi_resolved
}

function getDefaultTransformers() {
  const transformers: TransformerFunction[] = []

  // auto detect pug
  try {
    require.resolve('pug')
    transformers.push(
      PugTransformer(),
    )
  }
  catch (e) {}

  return transformers
}

export function resolveOptions(options: UserOptions | ResolvedOptions = {}): ResolvedOptions {
  if (isResolvedOptions(options))
    return options

  const {
    scan = true,
    preflight = true,
    transformCSS = true,
    transformGroups = true,
    sortUtilities = true,
  } = options

  const preflightOptions = Object.assign(
    {
      includeBase: true,
      includeGlobal: true,
      includePlugin: true,
      enableAll: false,
      safelist: [],
      blocklist: [],
      alias: {},
    },
    typeof preflight === 'boolean' ? {} : preflight,
  ) as unknown as ResolvedOptions['preflightOptions']

  const scanOptions = Object.assign(
    {
      fileExtensions: ['html', 'vue', 'md', 'mdx', 'pug', 'jsx', 'tsx', 'svelte'],
      dirs: ['src'],
      exclude: ['node_modules', '.git'],
      include: [] as string[],
      runOnStartup: true,
      transformers: getDefaultTransformers(),
    },
    typeof scan === 'boolean' ? {} : scan,
  )

  const safelist = new Set(toArray(options.safelist || []).flatMap(i => i.split(' ')))
  const blocklist = new Set(toArray(options.blocklist || []).flatMap(i => i.split(' ')))

  preflightOptions.safelist = new Set<string>(
    toArray(preflightOptions.safelist || [])
      // @ts-expect-error cast
      .flatMap(i => i.split(' '))
      .map((i) => {
        // selector
        const match = i.match(/^\[(.*?)\]$/)?.[1]
        if (match)
          return `div ${match}`
        return i
      }))

  preflightOptions.blocklist = new Set<string>(
    toArray(preflightOptions.blocklist || [])
      // @ts-expect-error cast
      .flatMap(i => i.split(' ')),
  )

  preflightOptions.alias = Object.fromEntries(
    Object
      .entries({
        ...defaultAlias,
        ...preflightOptions.alias,
      })
      .filter(([k, v]) => [kebabCase(k), v]),
  )

  return {
    ...options,
    scan: Boolean(scan),
    scanOptions,
    preflight: Boolean(preflight),
    preflightOptions,
    transformCSS,
    transformGroups,
    sortUtilities,
    safelist,
    blocklist,
    // @ts-expect-error internal
    __windi_resolved: true,
  }
}
