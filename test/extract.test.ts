import { DefaultExtractor, SvelteExtractor } from '../packages/plugin-utils/src/extractors'

describe('extract', () => {
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

  it('before:', () => {
    expect(DefaultExtractor(`
      <p class="before:w-24"></p>
    `).classes,
    ).toContain('before:w-24')
  })

  // #228, #237
  it('svelte', () => {
    const { classes } = SvelteExtractor(`
      <p class:bg-red-400={predicate}></p>
      <p class:bg-red-500="{predicate}"></p>
    `)
    expect(classes).toContain('bg-red-400')
    expect(classes).toContain('bg-red-500')
  })
})
