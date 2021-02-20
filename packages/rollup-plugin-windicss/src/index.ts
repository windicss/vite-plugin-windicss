import { Plugin } from 'rollup'
import _debug from 'debug'
import { UserOptions, WindiPluginUtils } from '@windicss/plugin-utils'

const NAME = 'rollup-plugin-windicss'
const MODULE_ID = 'windi.css'
const MODULE_ID_VIRTUAL = `/@windicss/${MODULE_ID}`

const debug = {
  hmr: _debug(`${NAME}:hmr`),
  css: _debug(`${NAME}:transform:css`),
  group: _debug(`${NAME}:transform:group`),
}

function WindiCssRollupPlugin(options: UserOptions = {}): Plugin[] {
  let utils: WindiPluginUtils

  const plugins: Plugin[] = []

  if (options.transformGroups !== false) {
    plugins.push({
      name: `${NAME}:groups`,
      transform(code, id) {
        if (!utils.isScanTarget(id))
          return
        debug.group(id)
        return utils.transfromGroups(code)
      },
    })
  }

  plugins.push({
    name: `${NAME}:entry`,

    resolveId(id): string | null {
      return id.startsWith(MODULE_ID) || id === MODULE_ID_VIRTUAL
        ? MODULE_ID_VIRTUAL
        : null
    },

    async load(id) {
      if (id === MODULE_ID_VIRTUAL)
        return utils.generateCSS()
    },
  })

  if (options.transformCSS !== false) {
    plugins.push({
      name: `${NAME}:css`,
      transform(code, id) {
        if (!utils.isCssTransformTarget(id))
          return
        debug.css(id)
        return utils.transformCSS(code)
      },
    })
  }

  return plugins
}

export * from '@windicss/plugin-utils'
export default WindiCssRollupPlugin
