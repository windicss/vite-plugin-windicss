<p align="center" style="background-color: #FFFF99; padding: 15px; border-radius: 5px;">
  <strong>⚠️ Windi CSS is Sunsetting ⚠️</strong><br>
  We are sunsetting Windi CSS and we recommend new projects to seek for alternatives. Read the <a href="https://windicss.org/posts/sunsetting.html">full blog post</a>.
</p>

<hr>

<h1 align='center'>vite-plugin-windicss</h1>

<p align='center'><a href="https://github.com/voorjaar/windicss">Windi CSS</a> for Vite, it's fast! ⚡️<br>
</p>

<p align='center'>
<a href='https://www.npmjs.com/package/vite-plugin-windicss'>
<img src='https://img.shields.io/npm/v/vite-plugin-windicss?color=0EA5E9&label='>
</a>
</p>

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

## Documentation

Read the [documentation](https://windicss.org/integrations/vite.html) for more details.

## New Features in v3.0

### [Attributify Mode](https://windicss.org/posts/v30.html#attributify-mode)

Enabled it by 

```ts
// windi.config.ts
export default {
  attributify: true,
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

#### Prefix

If you are concerned about naming confliction, you can add custom prefix to attributify mode by:

```ts
// windi.config.ts
export default {
  attributify: {
    prefix: 'w:',
  },
}
```

```html
<button 
  w:bg="blue-400 hover:blue-500 dark:blue-500 dark:hover:blue-600"
  w:text="sm white"
  w:font="mono light"
  w:p="y-2 x-4"
  w:border="2 rounded blue-200"
>
  Button
</button>
```

### [Alias Config](https://windicss.org/posts/v30.html#alias-config)

```ts
// windi.config.ts
export default {
  alias: {
    'hstack': 'flex items-center',
    'vstack': 'flex flex-col',
    'icon': 'w-6 h-6 fill-current',
    'app': 'text-red',
    'app-border': 'border-gray-200 dark:border-dark-300',
  },
}
```

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

MIT License &copy; 2021 [Anthony Fu](https://github.com/antfu)
