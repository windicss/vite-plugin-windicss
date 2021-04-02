import { resolve } from 'path'
import { createUtils } from '../src'

describe('fixtures', () => {
  it('scan', async() => {
    const root = resolve(__dirname, '../fixtures/scan')
    const utils = createUtils({
      root,
      scan: true,
    })
    await utils.init()
    await utils.scan()
    expect(utils.files).toMatchSnapshot('files')
    expect(utils.options.scanOptions.include).toMatchSnapshot('include')
    expect(utils.options.scanOptions.exclude).toMatchSnapshot('exclude')
    expect(utils.classesPending).toMatchSnapshot('classes')

    expect(utils.isDetectTarget(resolve(root, 'index.html'))).toBe(false)
    expect(utils.isDetectTarget(resolve(root, '..', 'a.js'))).toBe(false)
    expect(utils.isDetectTarget(resolve(root, 'not-exist', 'd.ts'))).toBe(false)

    expect(utils.isDetectTarget(resolve(root, 'd.js'))).toBe(true)
    expect(utils.isDetectTarget(resolve(root, 'no-exist', 'd.js'))).toBe(true)
  })
})
