import type { WindiPluginUtils } from '@windicss/plugin-utils'
import type { ModuleNode, Update, ViteDevServer } from 'vite'
import { MODULE_ID_VIRTUAL_MODULES, MODULE_ID_VIRTUAL_PREFIX } from '../../shared/virtual-module'

export function getChangedModuleNames(utils: WindiPluginUtils) {
  if (utils.hasPending)
    utils.buildPendingStyles()

  const moduleNames = [
    `${MODULE_ID_VIRTUAL_PREFIX}.css`,
  ]

  Object.entries(utils.layersMeta).forEach(([name, meta]) => {
    if (meta.cssCache == null)
      moduleNames.push(`${MODULE_ID_VIRTUAL_PREFIX}-${name}.css`)
  })

  return moduleNames
}

export function getCssModules(server: ViteDevServer, names = MODULE_ID_VIRTUAL_MODULES): ModuleNode[] {
  return names
    .map(name => server.moduleGraph.getModuleById(name)!)
    .filter(Boolean)
}

export function invalidateCssModules(server: ViteDevServer, modules: ModuleNode[] = getCssModules(server)) {
  return modules.forEach(m => server.moduleGraph.invalidateModule(m))
}

export function sendHmrReload(server: ViteDevServer, modules: ModuleNode[] = getCssModules(server)) {
  const timestamp = +Date.now()

  server.ws.send({
    type: 'update',
    updates: modules.map<Update>(m => ({
      acceptedPath: m.id || m.file!,
      path: m.id || m.file!,
      timestamp,
      type: 'js-update',
    })),
  })
}

export function reloadChangedCssModules(server: ViteDevServer, utils: WindiPluginUtils) {
  const cssModules = getCssModules(server, getChangedModuleNames(utils))

  invalidateCssModules(server, cssModules)
  sendHmrReload(server, cssModules)

  return cssModules
}
