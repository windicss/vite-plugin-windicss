import { createBox } from '../src/box'

describe('cases', () => {
  // #16
  it('conditional', async() => {
    const box = createBox({ windicssOptions: {}, preflight: false, scan: false })
    box.init()
    // eslint-disable-next-line no-template-curly-in-string
    box.extractFile('<span :class="`${selected ? \'font-semibold\' : \'font-normal\'} block truncate`">')

    const css = await box.generateCSS()
    expect(box.classesGenerated.size).toBe(4)
    expect(box.classesGenerated).toMatchSnapshot('classes')
    expect(css).toMatchSnapshot('generated-css')
  })

  // #16
  it('uppercase classnames', async() => {
    const box = createBox({ windicssOptions: {}, preflight: false, scan: false })
    box.init()
    box.extractFile('"text-lightBlue-500"')

    const css = await box.generateCSS()
    expect(box.classesGenerated).toMatchSnapshot('classes')
    expect(css).toMatchSnapshot('generated-css')
  })

  // #17
  it('multiple lines', async() => {
    const box = createBox({ windicssOptions: {}, preflight: false, scan: false })
    box.init()
    box.extractFile('"p-4\nm-5"')

    const css = await box.generateCSS()
    expect(box.classesGenerated.size).toBe(2)
    expect(box.classesGenerated).toMatchSnapshot('classes')
    expect(css).toMatchSnapshot('generated-css')
  })
})
