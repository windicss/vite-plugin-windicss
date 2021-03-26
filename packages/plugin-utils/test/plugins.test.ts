import { createUtils } from '../src'

describe('plugins', () => {
  it('aspect-ratio', async() => {
    const utils = createUtils({
      config: {
        plugins: [
          require('windicss/plugin/aspect-ratio'),
        ],
      },
      scan: false,
      preflight: false,
    })
    await utils.init()
    utils.extractFile('"aspect-none aspect-w-16 aspect-h-9 aspect-16/9"')

    const css = await utils.generateCSS()
    expect(utils.classesGenerated).toMatchSnapshot('classes')
    expect(css).toMatchSnapshot('generated-css')
  })

  it('forms', async() => {
    const utils = createUtils({
      config: {
        plugins: [
          require('windicss/plugin/forms'),
        ],
      },
      preflight: {
        includeBase: false,
      },
      scan: false,
    })
    await utils.init()

    utils.extractFile('<input type="text"/><input type="number"/><select multiple/>')

    const css = await utils.generateCSS()
    expect(utils.classesGenerated).toMatchSnapshot('classes')
    expect(css).toMatchSnapshot('generated-css')
  })

  it('forms', async() => {
    const utils = createUtils({
      config: {
        plugins: [
          require('windicss/plugin/forms'),
        ],
      },
      preflight: {
        includeBase: false,
        safelist: ['[type="text"]', '[type="number"]'],
      },
      scan: false,
    })
    await utils.init()

    const css = await utils.generateCSS()
    expect(utils.classesGenerated).toMatchSnapshot('classes')
    expect(css).toMatchSnapshot('generated-css')
  })
})
