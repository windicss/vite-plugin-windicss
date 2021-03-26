export const regexQuotedString = /(["'`])((?:\\\1|(?:(?!\1)|\n|\r).)*?)\1/mg
export const regexClassCheck = /^[!a-z\d.+-]+[\w:/\\.$()-]*[\w)]$/
export const regexHtmlTag = /<(\w[\w-]*)[\S\s]*?\/?>/mg
export const regexClassSplitter = /[\s'"`{}]/g
export const regexClassGroup = /([!\w+-][\w+:_/-]*?\w):\(([\w\s/-]*?)\)/gm
