export const regexQuotedString = /(["'`])((?:\\\1|\\\\|\n|\r|.)*?)\1/mg
export const regexHtmlTag = /<(\w[\w-]*)([\S\s]*?)\/?>/mg
export const regexClassSplitter = /[\s'"`{}]/g
export const regexClassGroup = /([!\w+-<@][\w+:_/-]*?\w):\(([!\w\s:/\\,%#\[\].$-]*?)\)/gm
export const regexAttributifyItem = /([\w+:_/-]+)=(['"])((?:\\\2|\\\\|\n|\r|.)*?)\2/gm

export const regexClassCheck1 = /^[!a-z\d@<>.+-](?:\([\w,.%#-]*\)|[\w:/\\,%#\[\].$-])*$/
export const regexClassCheck2 = /[a-z].*[\w)\]]$/
export const regexClassChecks = [
  regexClassCheck1,
  regexClassCheck2,
]

export function validClassName(i: string) {
  return regexClassChecks.every(r => i.match(r))
}
