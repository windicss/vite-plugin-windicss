import { DefaultExtractor } from '../packages/plugin-utils/src/extractors/default'

describe('extract', () => {
  it('attributify', () => {
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

  // #162, #193
  it('partial 1', () => {
    expect(DefaultExtractor(`
      /* I'll fix this */
      const class = 'p-2'
    `).classes,
    ).toContain('p-2')
  })

  it('partial 2', () => {
    expect(DefaultExtractor(`
      <!-- I'll fix this -->
      <p class='p-2'></p>
    `).classes,
    ).toContain('p-2')
  })

  it('partial 3', () => {
    expect(DefaultExtractor(`
      <!-- I'll fix this -->
      <p class="p-2"></p>
      <!-- I'll fix that -->
    `).classes,
    ).toContain('p-2')
  })

  it('partial 4', () => {
    expect(DefaultExtractor(`
      <p class="<sm:text-primary"></p>
    `).classes,
    ).toContain('<sm:text-primary')
  })
})
