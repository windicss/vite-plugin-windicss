import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import { createUtils } from '../packages/plugin-utils/src'

describe('example', () => {
  it('should work', async() => {
    const utils = createUtils({}, {
      root: resolve(__dirname, '../examples/vue'),
      onConfigurationError(e) {
        throw e
      },
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
      root: resolve(__dirname, '../examples/vue'),
      onConfigurationError(e) {
        throw e
      },
    })
    await utils.init()
    await utils.generateCSS()
    expect(classesPending).toMatchSnapshot('classesPending')
    expect(tagsPending).toMatchSnapshot('tagsPending')
    expect(classes).toMatchSnapshot('classes')
    expect(tags).toMatchSnapshot('tags')
  })

  it('v3', async() => {
    const utils = createUtils(
      {
        preflight: false,
      },
      {
        root: resolve(__dirname, '../examples/windicss-v3'),
        onConfigurationError(e) {
          throw e
        },
      },

    )
    await utils.init()
    const base = await utils.generateCSS('base')
    const components = await utils.generateCSS('components')
    const utilities = await utils.generateCSS('utilities')

    expect(base).toMatchSnapshot('base')
    expect(components).toMatchSnapshot('components')
    expect(utilities).toMatchSnapshot('utilities')
  })
})
