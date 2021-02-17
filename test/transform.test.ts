import { transfromGroups } from '../src/box/utils'

describe('transfrom', () => {
  it('group basic', async() => {
    expect(
      transfromGroups('bg-white font-light sm:hover:(bg-gray-100 font-medium)'),
    ).toMatchSnapshot()
  })
})
