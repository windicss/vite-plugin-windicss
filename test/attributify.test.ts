import { DefaultExtractor } from '../packages/plugin-utils/src/extractors/default'
import { createUtils } from '../packages/plugin-utils/src'

describe('attributify', () => {
  it('basic', () => {
    expect(DefaultExtractor(`
      <div
        p="x-4 y-2 md:x-2 lg:hover:x-8"
        border="~"
        sm="bg-red-500 bg-opacity-50 hover:bg-green-300"
        sm:hover="text-red-500 text-lg focus:bg-white"
dark:border="~ red-400"
        @click="a()"
        class="text-red-400"
      />
    `),
    ).toMatchSnapshot()
  })

  it('jsx', async() => {
    const utils = createUtils({
      config: {
        attributify: true,
      },
      safelist: ['bg-gradient-to-r'],
      preflight: false,
      scan: false,
    })
    const code = `
    <nav
      pos="fixed top-0"
      w="full"
      z="30"
      bg={props.scrolled() || props.opened() ? 'white' : 'transparent'}
      shadow={props.scrolled() ? 'md' : 'none'}
    >
      {props.children}
    </nav>
    `
    expect(DefaultExtractor(code)).toMatchSnapshot()
    await utils.ensureInit()
    await utils.extractFile(code)

    expect(await utils.generateCSS()).toMatchSnapshot()
  })
})
