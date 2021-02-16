import { createBox } from '../src/box'

describe('plugins', () => {
  it('aspect-ratio', async() => {
    const box = createBox({
      windicssOptions: {
        plugins: [
          require('windicss/plugin/aspect-ratio'),
        ],
      },
      preflight: false,
    })
    box.init()
    box.extractFile('"aspect-none"')

    const css = await box.generateCSS()
    expect(box.classesGenerated).toMatchSnapshot('classes')
    expect(css).toMatchSnapshot('generated-css')
  })
})
