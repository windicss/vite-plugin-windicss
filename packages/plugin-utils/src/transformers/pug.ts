import { Transformer, TransformerOptions } from './types'

const regexTemplate = /<template.*?lang=['"]pug['"][^>]*?>\n([\s\S]*?\n)<\/template>/gm

export const PugTransformer: Transformer<TransformerOptions> = ({
  include = [/\.vue$/, /\.pug$/],
} = {}) => (code: string, id: string) => {
  if (!include.some(i => id.match(i)))
    return

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Pug = require('pug') as typeof import('pug')

  const compile = (code: string) => {
    try {
      return Pug.compile(code, { filename: id })()
      // other build processes will catch pug errors
    }
    catch {}
  }

  if (id.match(/\.vue$/)) {
    const matches = Array.from(code.matchAll(regexTemplate))
    let tail = ''
    for (const match of matches) {
      if (match && match[1])
        tail += `\n\n${compile(match[1])}`
    }
    if (tail)
      return `${code}\n\n${tail}`
  }
  else {
    return compile(code)
  }
}
