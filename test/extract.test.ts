import { SvelteExtractor, DefaultExtractor } from '../packages/plugin-utils/src/extractors'

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

  // #228
  it('svelte', () => {
    expect(SvelteExtractor(`
      <p class:bg-red-400={predicate}></p>
    `).classes,
    ).toContain('bg-red-400')
  })
})
