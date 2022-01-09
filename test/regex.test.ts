import { describe, expect, it } from 'vitest'
import { validClassName } from '../packages/plugin-utils/src/regexes'

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
    expect(validClassName('p-[#12px]')).toBeTruthy()
    expect(validClassName('p-[#123]')).toBeTruthy()
    expect(validClassName('text-[hsl(360,100%,50%)]')).toBeTruthy()
    expect(validClassName('grid-rows-[auto,max-content,10px]')).toBeTruthy()
    expect(validClassName('!sm:w-full')).toBeTruthy()
    expect(validClassName('!<sm:w-full')).toBeTruthy()
    expect(validClassName('!+sm:w-full')).toBeTruthy()
    expect(validClassName('!-sm:w-full')).toBeTruthy()
    expect(validClassName('!@sm:w-full')).toBeTruthy()
    expect(validClassName('p-[calc(10px+12rem)]')).toBeTruthy()

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
    expect(validClassName('<!sm:w-full')).toBeFalsy()
  })
})
