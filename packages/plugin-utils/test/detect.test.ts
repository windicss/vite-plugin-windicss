import { createUtils } from '../src'

describe('detect', () => {
  // #111
  it('custom classes with parentheses', async() => {
    const utils = createUtils({
      config: {
        theme: {
          extend: {
            height: (theme: any) => ({
              '(custom)': `calc(100% - ${theme('spacing.16')})`,
            }),
          },
        },
      },
      preflight: false,
      scan: false,
    })
    await utils.init()
    await utils.extractFile('class="h-(custom)"')
    const css = await utils.generateCSS()
    expect(utils.classesGenerated.size).toBe(1)
    expect(css).toMatchSnapshot('generated-css')
  })
})
