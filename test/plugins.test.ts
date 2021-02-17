import { createBox } from '../src/box'

describe('plugins', () => {
  it('aspect-ratio', async() => {
    const box = createBox({
      windicssOptions: {
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
})
