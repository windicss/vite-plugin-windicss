import { describe, expect, it } from 'vitest'
import { createUtils } from '../packages/plugin-utils/src'

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
    await utils.init()
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
    await utils.init()
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
    await utils.init()

    expect(utils.options.preflightOptions.includeBase).toBe(false)
    expect(utils.options.preflightOptions.includeGlobal).toBe(true)
  })

  // #114
  it('merge config', async() => {
    const utils = createUtils({
      config: {
        theme: {
          extend: {
            fontFamily: {
              corsiva: 'monotype corsiva',
            },
          },
        },
      },
      preflight: false,
      scan: false,
    })
    await utils.init()

    utils.addClasses(['font-corsiva'])
    const css = await utils.generateCSS()
    expect(utils.classesGenerated.size).toBe(1)
    expect(css).toMatchSnapshot()
  })

  it('nested safelist', async() => {
    const utils = createUtils({
      config: {
        safelist: 'shortcut',
        shortcuts: {
          shortcut: 'p-4',
        },
      },
      safelist: ['p-3'],
      preflight: false,
      scan: false,
    })
    await utils.init()
    await utils.generateCSS()

    expect(utils.classesGenerated.size).toBe(2)
  })

  it('prefixer: true', async() => {
    const utils = createUtils({
      config: {
        prefixer: true,
      },
      safelist: ['bg-gradient-to-r'],
      preflight: false,
      scan: false,
    })
    await utils.init()
    expect(await utils.generateCSS()).toMatchSnapshot('css')
  })

  it('prefixer: false', async() => {
    const utils = createUtils({
      config: {
        prefixer: false,
      },
      safelist: ['bg-gradient-to-r'],
      preflight: false,
      scan: false,
    })
    await utils.init()
    expect(await utils.generateCSS()).toMatchSnapshot('css')
  })
})
