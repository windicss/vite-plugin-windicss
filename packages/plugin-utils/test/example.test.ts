import { resolve } from 'path'
import { createBox } from '../src'

describe('example', () => {
  it('should work', async() => {
    const box = createBox({
      root: resolve(__dirname, '../../../example'),
    })
    box.init()
    const css = await box.generateCSS()
    expect(box.classesGenerated).toMatchSnapshot('classes')
    expect(box.tagsGenerated).toMatchSnapshot('tags')
    expect(css).toMatchSnapshot('generated-css')
  })
})
