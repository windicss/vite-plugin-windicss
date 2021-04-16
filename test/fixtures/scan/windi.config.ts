import { defineConfig } from 'windicss/helpers'

export default defineConfig({
  extract: {
    include: [
      '**/*.js',
      'a.ts',
    ],
    exclude: [],
  },
})
