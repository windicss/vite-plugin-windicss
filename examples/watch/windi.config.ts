import { defineConfig } from 'windicss/helpers'

export default defineConfig({
  preflight: false,
  extract: {
    include: [
      'main.js',
    ],
  },
})
