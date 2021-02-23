import { resolve } from 'path'
import { createUtils } from '../src'

describe('example', () => {
  it('should work', async() => {
    const utils = createUtils({}, {
      root: resolve(__dirname, '../../../example'),
    })
    utils.init()
    const css = await utils.generateCSS()
    expect(utils.classesGenerated).toMatchSnapshot('classes')
    expect(utils.tagsGenerated).toMatchSnapshot('tags')
    expect(css).toMatchSnapshot('generated-css')
  })

  it('should allow access to generated tags and classes by a callback', async() => {
    let classesByCallback, tagsByCallback
    const utils = createUtils({
      onGenerated: (classes, tags) => {
        classesByCallback = classes
        tagsByCallback = tags
      },
    }, {
      root: resolve(__dirname, '../../../example'),
    })
    utils.init()
    await utils.generateCSS()
    expect(classesByCallback).toMatchSnapshot('classes')
    expect(tagsByCallback).toMatchSnapshot('tags')
  })
})
