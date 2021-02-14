import _debug from 'debug'

export const debug = {
  config: _debug('vite-plugin-windicss:config'),
  debug: _debug('vite-plugin-windicss:debug'),
  compile: _debug('vite-plugin-windicss:compile'),
  glob: _debug('vite-plugin-windicss:glob'),
  detect: _debug('vite-plugin-windicss:detect'),
  hmr: _debug('vite-plugin-windicss:hmr'),
}
