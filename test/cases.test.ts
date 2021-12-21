import type { WindiPluginUtils } from '../packages/plugin-utils/src'
import { createUtils } from '../packages/plugin-utils/src'

describe('cases', () => {
  let utils: WindiPluginUtils

  beforeEach(async() => {
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
    await utils.extractFile('<span :class="`${selected ? \'font-semibold\' : \'font-normal\'} block truncate`">')
    await utils.generateCSS()
    expect(utils.classesGenerated.size).toBe(4)
  })

  // #16
  it('uppercase classnames', async() => {
    await utils.extractFile('"text-light-blue-500"')
  })

  // #17
  it('multiple lines', async() => {
    await utils.extractFile('"p-4\nm-5"')

    await utils.generateCSS()
    expect(utils.classesGenerated.size).toBe(2)
  })

  it('utilities grouping', async() => {
    await utils.extractFile('"bg-white font-light sm:hover:(bg-gray-100 font-medium)"')

    expect(utils.classesPending).toMatchSnapshot('classes-pending')
  })

  it('variables', async() => {
    await utils.extractFile('"bg-$test-variable"')
  })

  // #20
  it('inline style', async() => {
    await utils.extractFile('<div style="max-width: 1920px;"><div class="relative top-0">')
  })

  it('leading + and numbers', async() => {
    await utils.extractFile('<div class="2xl:text-xl +lg:bg-red-900">')
  })

  it('!important', async() => {
    await utils.extractFile('<div class="mt-10 !m-2">')
  })

  it('!important groups', async() => {
    await utils.extractFile('<div class="mt-10 pt-10 !hover:(m-2 p-2)">')
  })

  it('square brackets', async() => {
    await utils.extractFile('<div class="grid-rows-[auto,max-content,10px] text-[1.5rem] text-[#9254d2] text-[rgb(123,123,23)]">')
  })

  it('baskslash escape', async() => {
    await utils.extractFile('<div class="text-xl \\" \r\rmt-10\nmb-2">')
  })

  it('baskslash escape 2', async() => {
    await utils.extractFile('<div class="text-xl \\\\" this is not "\'mt-10\'">')
  })
})
