import { relative, resolve } from 'path'
import { createUtils, slash } from '../packages/plugin-utils/src'

describe('fixtures', () => {
  it('scan', async() => {
    const root = resolve(__dirname, 'fixtures/scan')
    const utils = createUtils({
      root,
      scan: true,
    })
    await utils.init()
    await utils.scan()
    expect(utils.files.map(i => slash(relative(root, i)))).toMatchSnapshot('files')
    expect(utils.options.scanOptions.include.map(i => slash(relative(root, i)))).toMatchSnapshot('include')
    expect(utils.options.scanOptions.exclude.map(i => slash(relative(root, i)))).toMatchSnapshot('exclude')
    expect(utils.classesPending).toMatchSnapshot('classes')

    expect(utils.isDetectTarget(resolve(root, 'index.html'))).toBe(false)
    expect(utils.isDetectTarget(resolve(root, '..', 'a.js'))).toBe(false)
    expect(utils.isDetectTarget(resolve(root, 'not-exist', 'd.ts'))).toBe(false)

    expect(utils.isDetectTarget(resolve(root, 'd.js'))).toBe(true)
    expect(utils.isDetectTarget(resolve(root, 'no-exist', 'd.js'))).toBe(true)
  })
})
