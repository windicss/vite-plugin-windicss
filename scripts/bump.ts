import fs from 'fs-extra'
import fg from 'fast-glob'
import { version } from '../package.json'

const pathes = fg.sync('packages/*/package.json', { onlyFiles: true })

for (const path of pathes) {
  const json = fs.readJSONSync(path)
  json.version = version
  fs.writeJSONSync(path, json, { spaces: 2 })
}
