import { createUtils } from '../src'

describe('config', () => {
  // #16
  it('nested safelist', async() => {
    const utils = createUtils({
      config: {},
      preflight: false,
      scan: false,
      safelist: [
        'px-1',
        ['px-2 px-3', 'px-4'],
      ],
    })
    utils.init()

    await utils.generateCSS()
    expect(utils.classesGenerated.size).toBe(4)
  })
})
