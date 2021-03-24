import { createUtils, ResolvedOptions } from '../src'

describe('config hooks', () => {
  it('work onOptionsResolved', () => {
    const utils = createUtils({
      config: {},
      onOptionsResolved: (config: ResolvedOptions) => {
        expect(config.safelist).toEqual(new Set<String>(['px-1', 'px-2', 'px-3', 'px-4']))
        config.safelist.add('px-5')
      },
      safelist: [
        'px-1',
        ['px-2 px-3', 'px-4'],
      ],
    })
    utils.init()
    expect(utils.options.safelist).toEqual(new Set<String>(['px-1', 'px-2', 'px-3', 'px-4', 'px-5']))
  })

  it('work onOptionsResolved', () => {
    const utils = createUtils({
      config: {
        prefix: 'windi-',
      },
      onConfigResolved: (config) => {
        expect(config).toEqual({ prefix: 'windi-' })
        config.prefix = 'not-windi-'
      },
    })
    utils.init()

    expect(utils.processor.config('prefix')).toEqual('not-windi-')
  })

  it('work onOptionsResolved to replace config', () => {
    const utils = createUtils({
      config: {
        prefix: 'windi-',
      },
      onConfigResolved: (config) => {
        expect(config).toEqual({ prefix: 'windi-' })
        return {
          darkMode: 'class',
        }
      },
    })
    utils.init()

    expect(utils.processor.config('darkMode')).toEqual('class')
    expect(utils.processor.config('prefix')).toEqual(undefined)
  })
})
