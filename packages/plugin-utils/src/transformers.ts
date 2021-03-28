export interface TransformerOptions {
  include?: RegExp[]
}

export type TransformerFunction = (code: string, id: string) => string | undefined | null

export type Transformer<T extends TransformerOptions> = (options?: T) => TransformerFunction
