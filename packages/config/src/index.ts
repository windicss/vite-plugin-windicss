import fs from 'fs'
import path from 'path'
import _debug from 'debug'
import type { JITI } from 'jiti'
import _jiti from 'jiti'
import type { FullConfig as WindiCssOptions } from 'windicss/types/interfaces'

let jiti: JITI

export type { WindiCssOptions }

export const defaultConfigureFiles = [
  'windi.config.ts',
  'windi.config.js',
  'windi.config.mjs',
  'windi.config.cjs',

  'windicss.config.ts',
  'windicss.config.js',
  'windicss.config.mjs',
  'windicss.config.cjs',

  'tailwind.config.ts',
  'tailwind.config.js',
  'tailwind.config.mjs',
  'tailwind.config.cjs',
]

export interface LoadConfigurationOptions {
  /**
   * Name for debug
   *
   * @default 'windi-plugin-utils'
   * @internal
   */
  name?: string
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
   *
   * @default [throw error]
   */
  onConfigurationError?: (error: unknown) => void
  /**
   * On configure file not found
   *
   * @default [emit warning]
   */
  onConfigurationNotFound?: (filepath: string) => void
}

export function loadConfiguration(options: LoadConfigurationOptions): {
  config: WindiCssOptions
  filepath?: string
  error?: unknown
} {
  if (!jiti)
    jiti = _jiti(undefined, { requireCache: false, cache: false, v8cache: false })

  let resolved: WindiCssOptions = {}
  let configFilePath: string | undefined
  let error: unknown

  const {
    name = 'windicss-config',
    config,
    root = process.cwd(),
    configFiles: configureFiles = defaultConfigureFiles,
    onConfigurationError = (e) => {
      throw e
    },
    onConfigurationNotFound = (path) => {
      console.warn(`[${name}] config file "${path}" not found, ignored`)
    },
  } = options

  const debugConfig = _debug(`${name}:config`)

  if (typeof config === 'string' || !config) {
    if (!config) {
      for (const name of configureFiles) {
        const tryPath = path.resolve(root, name)
        if (fs.existsSync(tryPath)) {
          configFilePath = tryPath
          break
        }
      }
    }
    else {
      configFilePath = path.resolve(root, config)
      if (!fs.existsSync(configFilePath)) {
        onConfigurationNotFound(config)
        configFilePath = undefined
      }
    }

    if (configFilePath) {
      try {
        debugConfig('loading from ', configFilePath)

        resolved = jiti(configFilePath)
        if (resolved.default)
          resolved = resolved.default
      }
      catch (e) {
        error = e
        configFilePath = undefined
        resolved = {}
        onConfigurationError?.(e)
      }
    }
  }
  else {
    resolved = config
  }

  debugConfig(resolved)

  return {
    error,
    config: resolved,
    filepath: configFilePath,
  }
}
