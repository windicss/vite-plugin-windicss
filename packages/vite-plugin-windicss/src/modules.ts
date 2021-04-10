import { ModuleNode, ViteDevServer, Update } from 'vite'
import { MODULE_ID_VIRTUAL_MODULES } from '../../shared/virtual-module'

export function getCssModules(server: ViteDevServer): ModuleNode[] {
  return MODULE_ID_VIRTUAL_MODULES
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
