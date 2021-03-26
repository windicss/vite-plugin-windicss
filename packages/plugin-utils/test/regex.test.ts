import { validClassName } from '../src/regexes'

describe('regex', () => {
  it('regexClassCheck', async() => {
    // truthy
    expect(validClassName('p-4')).toBeTruthy()
    expect(validClassName('p-3.2em')).toBeTruthy()
    expect(validClassName('mt-1/2')).toBeTruthy()
    expect(validClassName('hover:text-green-500')).toBeTruthy()
    expect(validClassName('active:hover:text-green-500')).toBeTruthy()
    expect(validClassName('block')).toBeTruthy()
    expect(validClassName('!block')).toBeTruthy()
    expect(validClassName('+sm:rounded')).toBeTruthy()
    expect(validClassName('-sm:rounded')).toBeTruthy()
    expect(validClassName('!active:hover:text-green-500')).toBeTruthy()
    expect(validClassName('p-(hello)')).toBeTruthy()
    expect(validClassName('p-(hello)-world')).toBeTruthy()

    // falsy
    expect(validClassName('')).toBeFalsy()
    expect(validClassName('p-4-')).toBeFalsy()
    expect(validClassName(' p-4 ')).toBeFalsy()
    expect(validClassName('hover:')).toBeFalsy()
    expect(validClassName('hover!')).toBeFalsy()
    expect(validClassName('p-!4')).toBeFalsy()
    expect(validClassName('(hello)')).toBeFalsy()
    expect(validClassName('p-(hello')).toBeFalsy()
    expect(validClassName('p-hello)')).toBeFalsy()
  })
})
