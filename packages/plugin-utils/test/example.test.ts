import { resolve } from 'path'
import { createUtils } from '../src'

describe('example', () => {
  it('should work', async() => {
    const utils = createUtils({
      _projectRoot: resolve(__dirname, '../../../example'),
    })
    utils.init()
    const css = await utils.generateCSS()
    expect(utils.classesGenerated).toMatchSnapshot('classes')
    expect(utils.tagsGenerated).toMatchSnapshot('tags')
    expect(css).toMatchSnapshot('generated-css')
  })
})
