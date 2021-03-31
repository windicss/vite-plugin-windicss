import { createUtils } from '@windicss/plugin-utils'

export function getMemoryUsageMB() {
  return Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100
}

export async function run() {
  const utils = createUtils({
    root: 'examples/vue',
  })

  await utils.init()

  console.log(`Init memory: ${getMemoryUsageMB()}`)

  await utils.generateCSS()

  console.log(`Init generate memory: ${getMemoryUsageMB()}`)

  await utils.extractFile('<div class="p-1 p-2 p-3"/>')

  console.log(`First extraction memory: ${getMemoryUsageMB()}`)

  for (let i = 0; i < 100; i++) {
    await utils.extractFile(`<div class="p-${i}"/>`)
    await utils.generateCSS()
  }

  console.log(`ClassesGenerated size: ${utils.classesGenerated.size}`)
  console.log(`100 extractions memory: ${getMemoryUsageMB()}`)
}

run()
