import type { Plugin } from 'rollup'
import _debug from 'debug'
import type { UserOptions } from '@windicss/plugin-utils'
import { createUtils } from '@windicss/plugin-utils'
import { createVirtualModuleLoader } from '../../shared/virtual-module'

const NAME = 'rollup-plugin-windicss'

const debug = {
  hmr: _debug(`${NAME}:hmr`),
  css: _debug(`${NAME}:transform:css`),
  group: _debug(`${NAME}:transform:group`),
  alias: _debug(`${NAME}:transform:alias`),
}

function WindiCssRollupPlugin(userOptions: UserOptions = {}): Plugin[] {
  const utils = createUtils(
    userOptions,
    {
      name: NAME,
      onConfigurationError(e) {
        throw e
      },
    },
  )
  const plugins: Plugin[] = []

  plugins.push({
    name: `${NAME}:alias`,
    async transform(code, id) {
      await utils.ensureInit()
      if (!utils.isDetectTarget(id))
        return
      debug.alias(id)
      return utils.transformAlias(code, true)
    },
  })

  if (userOptions.transformGroups !== false) {
    plugins.push({
      name: `${NAME}:groups`,
      async transform(code, id) {
        await utils.ensureInit()
        if (!utils.isDetectTarget(id))
          return
        debug.group(id)
        return utils.transformGroups(code, true)
      },
    })
  }

  plugins.push({
    name: `${NAME}:entry`,

    ...createVirtualModuleLoader({ utils }),
  })

  if (userOptions.transformCSS !== false) {
    plugins.push({
      name: `${NAME}:css`,
      async transform(code, id) {
        await utils.ensureInit()
        if (!utils.isCssTransformTarget(id))
          return
        debug.css(id)
        return utils.transformCSS(code, id)
      },
    })
  }

  return plugins
}

export * from '@windicss/plugin-utils'
export default WindiCssRollupPlugin
