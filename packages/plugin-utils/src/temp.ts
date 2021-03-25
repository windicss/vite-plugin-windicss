import { Config } from 'windicss/types/interfaces'

export interface ExtractorResultDetailed {
  attributes?: {
    names: string[]
    values: string[]
  }
  classes?: string[]
  ids?: string[]
  tags?: string[]
  undetermined?: string[]
}

export interface Extractor {
  extractor: (content: string) => ExtractorResultDetailed | Promise<ExtractorResultDetailed>
  extensions: string[]
}

export interface ExtractOptions {
  /**
   * Globs of files to be included from extractions
   */
  include?: string[]
  /**
   * Globs of files to be excluded from extractions
   *
   * @default ['node_modules', '.git']
   */
  exclude?: string[]
  /**
   * Extractors to handle different file types.
   * Compatible with PurgeCSS
   */
  extractors?: Extractor[]
}

export interface PreflightOptions {
  /**
   * Include all the preflight regardless the template
   *
   * @default false
   */
  includeAll?: boolean

  /**
   * Safelist of preflight that will always be included in the generated CSS
   */
  safelist?: string | (string | string[])[]

  /**
   * Blocklist of preflight that will always be excluded in the generated CSS
   */
  blocklist?: string | (string | string[])[]

  /**
   * Alias for resolving preflight
   */
  alias?: Record<string, string>

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

export interface FullConfig extends Config {
  /**
   * Safelist of utilities that will always be included in the generated CSS
   */
  safelist?: string | (string | string[])[]
  /**
   * Blocklist of utilities that will always be excluded in the generated CSS
   */
  blocklist?: string | (string | string[])[]
  /**
   * Extractions options
   */
  extract?: ExtractOptions
  /**
   * Preflight options
   * Set `false` to disable preflight
   *
   * @default true
   */
  preflight?: PreflightOptions | boolean
}
