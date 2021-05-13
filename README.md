<h1 align='center'>vite-plugin-windicss</h1>

<p align='center'><a href="https://github.com/voorjaar/windicss">Windi CSS</a> for Vite, it's fast! ⚡️<br>
</p>

<p align='center'>
<a href='https://www.npmjs.com/package/vite-plugin-windicss'>
<img src='https://img.shields.io/npm/v/vite-plugin-windicss?color=0EA5E9&label='>
</a>
</p>

<details>
<summary>Features</summary>

## Features

- ⚡️ **It's FAST** - 20~100x times faster than Tailwind on Vite
- 🧩 On-demand CSS utilities (Fully compatible with Tailwind CSS v2)
- 📦 On-demand native elements style reseting (preflight)
- 🔥 Hot module replacement (HMR)
- 🍃 Load configurations from `tailwind.config.js`
- 🤝 Framework-agnostic - Vue, React, Svelte and vanilla!
- 📄 CSS `@apply` / `@screen` directives transforms (also works for Vue SFC's `<style>`)
- 🎳 Support Variant Groups - e.g. `bg-gray-200 hover:(bg-gray-100 text-red-300)`
- 😎 ["Design in Devtools"](#design-in-devtools) - if you work this way in the traditional Tailwind, no reason we can't!

</details>

## Install

This branch is for [**Windi CSS v3.0**](https://windicss.org/posts/v30.html) support. Both `windicss` and `vite-plugin-windicss` are release under `@next` tag at this moment.

Install them by:

```bash
npm i -D vite-plugin-windicss@next windicss
# or
yarn add -D vite-plugin-windicss@next windicss
```

```ts
// vite.config.js
import WindiCSS from 'vite-plugin-windicss'

export default {
  plugins: [
    WindiCSS()
  ],
}
```

```ts
// main.js
import 'virtual:windi.css'
```

## New Features in v3.0

### [Attributify Mode](https://windicss.org/posts/v30.html#attributify-mode)

Enabled it by 

```ts
// windi.config.ts
export default {
  attributify: true
}
```

And use them as you would like:

```html
<button 
  bg="blue-400 hover:blue-500 dark:blue-500 dark:hover:blue-600"
  text="sm white"
  font="mono light"
  p="y-2 x-4"
  border="2 rounded blue-200"
>
  Button
</button>
```

### [Alias Config](https://windicss.org/posts/v30.html#alias-config)

> TBD

## Documentation

Read the [documentation](https://windicss.org/integrations/vite.html) for more details.

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

MIT License &copy; 2021 [Anthony Fu](https://github.com/antfu)
