import { LayerName, WindiPluginUtils } from '@windicss/plugin-utils'
import type { Plugin } from 'rollup'

export const MODULE_IDS = [/^virtual:windi(.*?)\.css/, /^windi(.*?)\.css/]
export const MODULE_ID_VIRTUAL_PREFIX = '/@windicss/windi'
export const MODULE_ID_VIRTUAL = /\/\@windicss\/windi-?(.*?)\.css/
export const MODULE_ID_VIRTUAL_MODULES = [
  '/@windicss/windi.css',
  '/@windicss/windi-base.css',
  '/@windicss/windi-utilities.css',
  '/@windicss/windi-components.css',
]

export function createVirtualModuleLoader(ctx: { utils: WindiPluginUtils }): Pick<Plugin, 'resolveId' | 'load'> {
  return {
    resolveId(id) {
      for (const idRegex of MODULE_IDS) {
        const match = id.match(idRegex)
        if (match)
          return `${MODULE_ID_VIRTUAL_PREFIX}${match[1]}.css`
      }
      return null
    },

    async load(id) {
      const match = id.match(MODULE_ID_VIRTUAL)
      if (match) {
        const layer = (match[1] as LayerName | undefined) || undefined
        const css = await ctx.utils.generateCSS(layer)
        return css
      }
    },
  }
}
