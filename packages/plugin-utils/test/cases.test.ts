import { createUtils, WindiPluginUtils } from '../src'

describe('cases', () => {
  let utils: WindiPluginUtils

  beforeEach(() => {
    utils = createUtils({ config: {}, preflight: false, scan: false })
    await utils.init()
  })

  afterEach(async() => {
    const css = await utils.generateCSS()
    expect(utils.classesGenerated).toMatchSnapshot('classes')
    expect(css).toMatchSnapshot('generated-css')
  })

  // #16
  it('conditional', async() => {
    // eslint-disable-next-line no-template-curly-in-string
    utils.extractFile('<span :class="`${selected ? \'font-semibold\' : \'font-normal\'} block truncate`">')

    await utils.generateCSS()
    expect(utils.classesGenerated.size).toBe(4)
  })

  // #16
  it('uppercase classnames', async() => {
    utils.extractFile('"text-light-blue-500"')
  })

  // #17
  it('multiple lines', async() => {
    utils.extractFile('"p-4\nm-5"')

    await utils.generateCSS()
    expect(utils.classesGenerated.size).toBe(2)
  })

  it('utilities grouping', async() => {
    utils.extractFile('"bg-white font-light sm:hover:(bg-gray-100 font-medium)"')

    expect(utils.classesPending).toMatchSnapshot('classes-pending')
  })

  it('variables', async() => {
    utils.extractFile('"bg-$test-variable"')
  })

  // #20
  it('inline style', async() => {
    utils.extractFile('<div style="max-width: 1920px;"><div class="relative top-0">')
  })

  it('leading + and numbers', async() => {
    utils.extractFile('<div class="2xl:text-xl +lg:bg-red-900">')
  })

  it('!important', async() => {
    utils.extractFile('<div class="mt-10 !m-2">')
  })

  it('!important groups', async() => {
    utils.extractFile('<div class="mt-10 pt-10 !hover:(m-2 p-2)">')
  })
})
