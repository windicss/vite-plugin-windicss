export const regexQuotedString = /(["'`])((?:\\\1|(?:(?!\1)|\n).)*?)\1/mg
export const regexClassCheck = /^[a-z\d.+-]+[\w:/\\.$-]*\w$/
export const regexHtmlTag = /<(\w[\w-]*)/g
export const regexClassSplitter = /[\s'"`{}]/g
export const regexClassGroup = /(\w[\w:_/-]*?):\(([\w\s/-]*?)\)/gm
