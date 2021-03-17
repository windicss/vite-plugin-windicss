import { createUtils } from '../src'

describe('transfrom', () => {
  it('groups', async() => {
    const cases = [
      'bg-white font-light sm:hover:(bg-gray-100 font-medium)',
      '-sm:hover:(p-1 p-2)',
      '+sm:(p-1 p-2)',
      'dark:+lg:(p-1 p-2)',
    ]
    const utils = createUtils()

    for (const c of cases) {
      const transformed = utils.transformGroups(c)
      expect(transformed).toMatchSnapshot(`"${c}"`)
      const transformedSourceMap = utils.transformGroupsWithSourcemap(c)?.code
      expect(transformedSourceMap).toBe(transformed)
    }
  })
})
