<h2 align='center'><samp>vite-plugin-windicss</samp></h2>

<p align='center'><b>{WIP}</b></p>

<p align='center'><a href="https://github.com/voorjaar/windicss">Windicss</a><em>(on-demand TailwindCSS)</em> for Vite</p>

<p align='center'>
<a href='https://www.npmjs.com/package/vite-plugin-windicss'>
<img src='https://img.shields.io/npm/v/vite-plugin-windicss?color=222&style=flat-square&label='>
</a>
</p>

## Feature

- On-demand CSS utilities (Compatible with TailwindCSS v2)
- Load configurations from `tailwind.config.js`
- HMR
- Preflight (TailwindCSS style reseting)
- {WIP} CSS `@apply` directive

## Usage

Install

```bash
npm i vite-plugin-windicss -D # yarn add vite-plugin-windicss -D
```

Add it to `vite.config.js`

```ts
// vite.config.js
import Vue from '@vitejs/plugin-vue'
import WindiCSS from 'vite-plugin-windicss'

export default {
  plugins: [
    Vue(),
    ...WindiCSS()
  ],
};
```

```ts
// main.js
import 'windi.css'
```

That's all. None of `tailwindcss` `postcss` `autoprefixer` needed, enjoy the speed ⚡️

## Example

See [./example](./example).

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

MIT License © 2021 [Anthony Fu](https://github.com/antfu)
