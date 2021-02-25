import { resolve } from 'path'
import { createUtils } from '../src'

describe('example', () => {
  it('should work', async() => {
    const utils = createUtils({}, {
      root: resolve(__dirname, '../../../examples/vue'),
    })
    utils.init()
    const css = await utils.generateCSS()
    expect(utils.classesGenerated).toMatchSnapshot('classes')
    expect(utils.tagsGenerated).toMatchSnapshot('tags')
    expect(css).toMatchSnapshot('generated-css')
  })

  it('should allow access to generated tags and classes by a callback', async() => {
    let classes, tags, classesPending, tagsPending
    const utils = createUtils({
      onBeforeGenerate(ctx) {
        classesPending = new Set(ctx.classesPending)
        tagsPending = new Set(ctx.tagsPending)
      },
      onGenerated(ctx) {
        classes = ctx.classes
        tags = ctx.tags
      },
    }, {
      root: resolve(__dirname, '../../../examples/vue'),
    })
    utils.init()
    await utils.generateCSS()
    expect(classesPending).toMatchSnapshot('classesPending')
    expect(tagsPending).toMatchSnapshot('tagsPending')
    expect(classes).toMatchSnapshot('classes')
    expect(tags).toMatchSnapshot('tags')
  })
})
