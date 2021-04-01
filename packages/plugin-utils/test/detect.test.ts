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

  it('false classes', async() => {
    const utils = createUtils({
      preflight: false,
      scan: false,
    })
    await utils.init()
    await utils.extractFile('class="100 200 (foo bar) 10.2 a"')
    expect(utils.classesPending.size).toBe(0)
  })

  it('true classes', async() => {
    const utils = createUtils({
      preflight: false,
      scan: false,
    })
    await utils.init()
    await utils.extractFile('class="@sm:block <sm:block"')
    expect(utils.classesPending.size).toBe(2)
  })
})
