<h1 align='center'>vite-plugin-windicss</h1>

<p align='center'><a href="https://github.com/voorjaar/windicss">Windi CSS</a> for Vite<br>
<sup><em>a.k.a On-demand Tailwind CSS</em></sup>
</p>

<p align='center'>
<a href='https://www.npmjs.com/package/vite-plugin-windicss'>
<img src='https://img.shields.io/npm/v/vite-plugin-windicss?color=0EA5E9&label='>
</a>
</p>

<p align='center'>
<a href='https://twitter.com/antfu7/status/1361398324587163648'>⚡️ See speed comparison with Tailwind</a>
</p>

## Features

- ⚡️ **It's FAST** - 20~100x times faster than Tailwind on Vite
- 🧩 On-demand CSS utilities (Compatible with Tailwind CSS v2)
- 📦 On-demand native elements style reseting
- 🔥 Hot module replacement (HMR)
- 🍃 Load configurations from `tailwind.config.js`
- 🤝 Framework-agnostic - Vue, React, Svelte and vanilla!
- 📄 CSS `@apply` / `@screen` directives transforms (also works for Vue SFC's `<style>`)

## Install

```bash
npm i vite-plugin-windicss -D # yarn add vite-plugin-windicss -D
```

```ts
// vite.config.js
import WindiCSS from 'vite-plugin-windicss'

export default {
  plugins: [
    ...WindiCSS()
  ],
};
```

```ts
// main.js
import 'windi.css'
```

That's all. Build your app just like what you would do with Tailwind CSS, but much faster! ⚡️

## Migration from Tailwind CSS

If you are already using Tailwind CSS for your Vite app, you can follow these instructions to migrate your installation.

### `package.json`

Some of your dependencies are no longer required, you can remove them if they were only needed for Tailwind CSS.

```diff
- "tailwindccs": "*",
- "postcss": "*",
- "autoprefixer": "*",
+ "vite-plugin-windicss": "*"
```

### `tailwind.config.js`

All `variants` are enabled, since the overhead they caused is fixed by Windi's on-demand nature. `purge` is no longer needed as well. `colors` and `plugins` imports need to be renamed to `windicss` instead.

```diff
-const colors = require('tailwindcss/colors')
+const colors = require('windicss/colors')
-const typography = require('@tailwindcss/typography')
+const typography = require('windicss/plugin/typography')

module.exports = {
- purge: {
-   content: [
-     './**/*.html',
-   ],
-   options: {
-     safelist: ['prose', 'prose-sm', 'm-auto'],
-   },
- },
- variants: {
-   extend: {
-     cursor: ['disabled'],
-   }
- },
  darkMode: 'class',
  plugins: [typography],
  theme: {
    extend: {
      colors: {
        teal: colors.teal,
      },
    }
  },
}
```

### `vite.config.js`

Add this plugin into your configuration.

```ts
// vite.config.js
import WindiCSS from 'vite-plugin-windicss'

export default {
  plugins: [
    /* ... */
    ...WindiCSS({
      safelist: 'prose prose-sm m-auto'
    })
  ],
};
```

### `main.js`

Import `windi.css` in your code entry.

```ts
import 'windi.css'
```

### `main.css`

You can now remove the Tailwind imports from your css entry.

```diff
- @import 'tailwindcss/base';
- @import 'tailwindcss/components';
- @import 'tailwindcss/utilities';
```

### Cleanup (optional)

The following files can be removed if you don't use their other features.

```diff
- postcss.config.js
```

### All set.

That's all, fire up Vite and enjoy the speed!

## Configuration

The following shows the default values for the configuration

```ts
{
  /**
   * Options for windicss/tailwindcss.
   * Also accepts string as config file path.
   *
   * @default 'tailwind.config.js'
   */
  windicssOptions?: WindiCssOptions | string

  /**
   * Enabled windicss preflight (a.k.a TailwindCSS style reset)
   *
   * @default true
   */
  preflight?: boolean | {
    /**
     * Safelist to always included
     */
    safelist?: string | string[]

    /**
      * Alias for resolving preflight
      */
    alias?: Record<string, TagNames>

    /**
     * @default true
     */
    includeBase?: boolean

    /**
     * @default true
     */
    includeGlobal?: boolean

    /**
     * @default true
     */
    includePlugin?: boolean
  }

  /**
   * Directories to search for classnames
   *
   * @default 'src'
   */
  searchDirs?: string[]

  /**
   * File extension to search for classnames
   *
   * @default 'html', 'vue'
   */
  searchExtensions?: string[]

  /**
   * Exclude globs
   *
   * @default []
   */
  searchExclude?: string[]

  /**
   * Transform CSS for `@apply` directive
   *
   * @default true
   */
  transformCSS?: boolean

  /**
   * Sort the genrate utilities
   *
   * @default true
   */
  sortUtilities?: boolean

  /**
   * Safe class names to be always included.
   */
  safelist?: string | string[]
}
```


## Example

See [./example](./example) or [`Vitesse@feat/windicss`](https://github.com/antfu/vitesse/tree/feat/windicss)

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

MIT License © 2021 [Anthony Fu](https://github.com/antfu)
