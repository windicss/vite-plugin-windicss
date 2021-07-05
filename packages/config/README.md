# @windicss/config

[Windi CSS](https://github.com/windicss/windicss) configurations loader.

```ts
import { loadConfiguration } from '@windicss/config'

// search for configuration file and load it from disk
// supports "{windi,windicss,tailwind}.config.{js,ts,mjs,cjs}"
const { config } = loadConfiguration({ root: __dirname })
```

## Configuration

See [src/index.ts](https://github.com/windicss/vite-plugin-windicss/blob/main/packages/config/src/index.ts).

## License

MIT License © 2021 [Anthony Fu](https://github.com/antfu)

