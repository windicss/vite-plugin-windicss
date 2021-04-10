import { resolve } from 'path'
import { createUtils } from '../src'

describe('example', () => {
  it('should work', async() => {
    const utils = createUtils({}, {
      root: resolve(__dirname, '../../../examples/vue'),
    })
    await utils.init()
    expect(await utils.generateCSS()).toMatchSnapshot('generated-css')

    // layers
    expect(await utils.generateCSS('base')).toMatchSnapshot('generated-css-base')
    expect(await utils.generateCSS('components')).toMatchSnapshot('generated-css-components')
    expect(await utils.generateCSS('utilities')).toMatchSnapshot('generated-css-utilities')

    expect(utils.classesGenerated).toMatchSnapshot('classes')
    expect(utils.tagsGenerated).toMatchSnapshot('tags')
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
    await utils.init()
    await utils.generateCSS()
    expect(classesPending).toMatchSnapshot('classesPending')
    expect(tagsPending).toMatchSnapshot('tagsPending')
    expect(classes).toMatchSnapshot('classes')
    expect(tags).toMatchSnapshot('tags')
  })
})
