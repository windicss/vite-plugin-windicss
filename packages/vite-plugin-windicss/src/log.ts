import { dim, bold } from 'chalk'

export function log(msg: string) {
  console.log(
    dim(new Date().toLocaleTimeString())
    + bold.blue` [windicss] `
    + msg,
  )
}
