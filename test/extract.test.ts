import { describe, expect, it } from 'vitest'
import { DefaultExtractor, SvelteExtractor, applyExtractors } from '../packages/plugin-utils/src/extractors'

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

  it('should merge result of multiple extractors', () => {
    return applyExtractors(`
      <div id="divId" class="divClass1 divClass2" title="divTitle"></div>
      ![imgAlt](/test.png){#imgId .imgClass1 .imgClass2}
    `,
    'test.md',
    [
      {
        extensions: ['html', 'md'],
        extractor: () => ({
          tags: ['div'],
          ids: ['divId'],
          classes: ['divClass1', 'divClass2'],
          attributes: { names: ['title'], values: ['divTitle'] },
        }),
      },
      {
        extensions: ['md'],
        extractor: () => ({
          tags: ['img'],
          ids: ['imgId'],
          classes: ['imgClass1', 'imgClass2'],
          attributes: { names: ['alt'], values: ['imgAlt'] },
        }),
      },
    ],
    ).then((results) => {
      expect(results.tags).to.have.members(['div', 'img'])
      expect(results.ids).to.have.members(['divId', 'imgId'])
      expect(results.classes).to.have.members(['divClass1', 'divClass2', 'imgClass1', 'imgClass2'])
      expect(results.attributes!.names).to.have.members(['title', 'alt'])
      expect(results.attributes!.values).to.have.members(['divTitle', 'imgAlt'])
    })
  })

  it('should work fine with the undefined property returned in extractor', () => {
    return applyExtractors(
      '<div className="flex justify-center items-center"></div>',
      'test.jsx',
      [
        {
          extensions: ['jsx'],
          extractor: () => ({
            classes: ['flex', 'justify-center', 'items-center'],
          }),
        },
      ],
    ).then((results) => {
      expect(results.tags).toEqual([])
      expect(results.ids).toEqual([])
      expect(results.attributes).toBeUndefined()
      expect(results.classes).toEqual(['flex', 'justify-center', 'items-center'])
    })
  })
})
