import { createBox } from '../src/box'

describe('cases', () => {
  it('upperCase classnames', async() => {
    const box = createBox({ preflight: false, scan: false })
    box.init()
    box.extractFile('"text-lightBlue-500"')

    const css = await box.generateCSS()
    expect(box.classesGenerated).toMatchSnapshot('classes')
    expect(css).toMatchSnapshot('generated-css')
  })
})
