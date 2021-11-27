import { dim, bold, blue } from 'kolorist'

export function log(msg: string) {
  console.log(
    dim(new Date().toLocaleTimeString())
    + bold(blue(' [windicss] '))
    + msg,
  )
}
