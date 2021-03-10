import { Plugin } from 'rollup'
import _debug from 'debug'
import { resolveOptions, UserOptions, WindiPluginUtils } from '@windicss/plugin-utils'

const NAME = 'rollup-plugin-windicss'
const MODULE_IDS = ['virtual:windi.css', 'windi.css', '@virtual/windi.css']
const MODULE_ID_VIRTUAL = '/@windicss/windi.css'

const debug = {
  hmr: _debug(`${NAME}:hmr`),
  css: _debug(`${NAME}:transform:css`),
  group: _debug(`${NAME}:transform:group`),
}

function WindiCssRollupPlugin(userOptions: UserOptions = {}): Plugin[] {
  let utils: WindiPluginUtils

  const options = resolveOptions(userOptions)
  const plugins: Plugin[] = []

  if (options.transformGroups) {
    plugins.push({
      name: `${NAME}:groups`,
      transform(code, id) {
        if (!utils.isDetectTarget(id))
          return
        debug.group(id)
        return utils.transformGroupsWithSourcemap(code)
      },
    })
  }

  plugins.push({
    name: `${NAME}:entry`,

    resolveId(id) {
      return MODULE_IDS.includes(id) || MODULE_IDS.some(i => id.startsWith(i))
        ? MODULE_ID_VIRTUAL
        : null
    },

    async load(id) {
      if (id === MODULE_ID_VIRTUAL)
        return utils.generateCSS()
    },
  })

  if (options.transformCSS) {
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
