import { createUtils } from '../src'

describe('config', () => {
  // #16
  it('nested safelist', async() => {
    const utils = createUtils({
      config: {
        safelist: [
          'px-1',
          ['px-2 px-3', 'px-4'],
        ],
      },
      preflight: false,
      scan: false,
    })
    utils.init()

    await utils.generateCSS()
    expect(utils.classesGenerated.size).toBe(4)
  })

  it('merge config', async() => {
    const utils = createUtils({
      config: {
        safelist: [
          'px-1',
        ],
        blocklist: 'a',
      },
      safelist: 'px-2 px-3',
      blocklist: ['b', 'c'],
      preflight: false,
      scan: false,
    })
    utils.init()

    await utils.generateCSS()
    expect(utils.options.safelist.size).toBe(3)
    expect(utils.options.blocklist.size).toBe(3)
  })

  it('merge config', async() => {
    const utils = createUtils({
      config: {
        preflight: {
          includeBase: false,
        },
      },
      preflight: {},
      scan: false,
    })
    utils.init()

    expect(utils.options.preflightOptions.includeBase).toBe(false)
    expect(utils.options.preflightOptions.includeGlobal).toBe(true)
  })
})
