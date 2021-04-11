import { createUtils } from '../packages/plugin-utils/src'

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
    await utils.extractFile('"aspect-none aspect-w-16 aspect-h-9 aspect-16/9"')

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

    await utils.extractFile('<input type="text"/><input type="number"/><select multiple/>')

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

  // #111
  it('custom classes with parentheses', async() => {
    const utils = createUtils({
      config: {
        theme: {
          extend: {
            height: (theme: any) => ({
              '(custom)': `calc(100% - ${theme('spacing.16')})`,
            }),
          },
        },
      },
      preflight: false,
      scan: false,
    })
    await utils.init()
    await utils.extractFile('class="h-(custom)"')
    const css = await utils.generateCSS()
    expect(utils.classesGenerated.size).toBe(1)
    expect(css).toMatchSnapshot('generated-css')
  })
})
