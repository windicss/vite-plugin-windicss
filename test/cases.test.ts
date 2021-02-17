import { createBox, WindiBox } from '../src/box'

describe('cases', () => {
  let box: WindiBox

  beforeEach(() => {
    box = createBox({ config: {}, preflight: false, scan: false })
    box.init()
  })

  afterEach(async() => {
    const css = await box.generateCSS()
    expect(box.classesGenerated).toMatchSnapshot('classes')
    expect(css).toMatchSnapshot('generated-css')
  })

  // #16
  it('conditional', async() => {
    // eslint-disable-next-line no-template-curly-in-string
    box.extractFile('<span :class="`${selected ? \'font-semibold\' : \'font-normal\'} block truncate`">')

    await box.generateCSS()
    expect(box.classesGenerated.size).toBe(4)
  })

  // #16
  it('uppercase classnames', async() => {
    box.extractFile('"text-lightBlue-500"')
  })

  // #17
  it('multiple lines', async() => {
    box.extractFile('"p-4\nm-5"')

    await box.generateCSS()
    expect(box.classesGenerated.size).toBe(2)
  })

  it('utilities grouping', async() => {
    box.extractFile('"bg-white font-light sm:hover:(bg-gray-100 font-medium)"')

    expect(box.classesPending).toMatchSnapshot('classes-pending')
  })

  it('variables', async() => {
    box.extractFile('"bg-$test-variable"')
  })
})
