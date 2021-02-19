import { createBox } from '../src'

describe('plugins', () => {
  it('aspect-ratio', async() => {
    const box = createBox({
      config: {
        plugins: [
          require('windicss/plugin/aspect-ratio'),
        ],
      },
      scan: false,
      preflight: false,
    })
    box.init()
    box.extractFile('"aspect-none aspect-w-16 aspect-h-9 aspect-16/9"')

    const css = await box.generateCSS()
    expect(box.classesGenerated).toMatchSnapshot('classes')
    expect(css).toMatchSnapshot('generated-css')
  })

  it('forms', async() => {
    const box = createBox({
      config: {
        plugins: [
          require('windicss/plugin/forms'),
        ],
      },
      scan: false,
      preflight: {
        enableAll: true,
      },
    })
    box.init()

    const css = await box.generateCSS()
    expect(box.classesGenerated).toMatchSnapshot('classes')
    expect(css).toMatchSnapshot('generated-css')
  })
})
