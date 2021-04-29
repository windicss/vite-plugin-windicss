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
      />
    `).attributes,
    ).toMatchSnapshot()
  })
})
