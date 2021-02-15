import { Config as WindiCssOptions } from 'windicss/types/interfaces'
import { htmlTags } from './constants'

export type TagNames = (typeof htmlTags)[number]

export interface Options {
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
   * Transform CSS for `@apply` directive
   *
   * @default true
   */
  transformCSS?: boolean

  /**
   * Safelist
   */
  safelist?: string | string[]
}
