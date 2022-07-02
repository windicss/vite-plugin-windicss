export const regexQuotedString = /(["'`])((?:\\\1|\\\\|\n|\r|(?!<|>|\s\*\/).)*?)\1/mg
export const regexHtmlTag = /<(\w[\w-]*)([\S\s]*?)\/?[^=]>/mg
export const regexClassSplitter = /[\s'"`{}]/g
export const regexClassGroup = /([!\w+-<@][\w+:_/-]*?\w):\(((?:[!\w\s:/\\,%#.$-]|\[.*?\])*?)\)/gm
export const regexAttributifyItem = /(?:\s|^)([\w+:_/-]+)\s*=\s*(['"{])((?:\\\2|\\\\|\n|\r|.)*?)(?:\2|\})/gm

export const regexClassCheck1 = /^!?[a-z\d@<>.+-](?:\([\w,.%#\(\)+-]*\)|[\w:/\\,%#\[\].$-])*$/
export const regexClassCheck2 = /[a-z].*[\w)\]]$/
export const regexClassChecks = [
  regexClassCheck1,
  regexClassCheck2,
]

export const regexSvelteClass = /class:([\w!:/\\,%#\[\].$-]+?)=["']?\{/g

export function validClassName(i: string) {
  return regexClassChecks.every(r => i.length > 2 && i.match(r))
}
