<h1 align='center'>rollup-plugin-windicss</h1>

<p align='center'><a href="https://github.com/voorjaar/windicss">Windi CSS</a> for Rollup! ⚡️<br>
<sup><em>a.k.a On-demand Tailwind CSS</em></sup>
</p>

<p align='center'>
<a href='https://www.npmjs.com/package/rollup-plugin-windicss'>
<img src='https://img.shields.io/npm/v/rollup-plugin-windicss?color=0EA5E9&label='>
</a>
</p>

## Features

- ⚡️ Fast
- 🧩 On-demand CSS utilities (Compatible with Tailwind CSS v2)
- 📦 On-demand native elements style reseting
- 🍃 Load configurations from `tailwind.config.js`
- 🤝 Framework-agnostic - Vue, React, Svelte and vanilla!
- 📄 CSS `@apply` / `@screen` directives transforms (also works for Vue SFC's `<style>`)
- 🎳 Support Utility Groups - e.g. `bg-gray-200 hover:(bg-gray-100 text-red-300)`

See [`vite-plugin-windicss`](https://github.com/antfu/vite-plugin-windicss) for more details.

## Install

```bash
npm i rollup-plugin-windicss -D # yarn add rollup-plugin-windicss -D
```

```ts
// rollup.config.js
import WindiCSS from 'rollup-plugin-windicss'

export default {
  plugins: [
    ...WindiCSS()
  ],
};
```

```ts
// your code entry
import '@virtual/windi.css'
```

That's all.

## Configuration

See [options.ts](https://github.com/windicss/vite-plugin-windicss/blob/main/packages/plugin-utils/src/options.ts).

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

MIT License © 2021 [Anthony Fu](https://github.com/antfu)
