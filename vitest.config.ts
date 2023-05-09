import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@windicss/config': resolve(__dirname, 'packages/config/src/index.ts'),
      '@windicss/plugin-utils': resolve(__dirname, 'packages/plugin-utils/src/index.ts'),
    },
  },
})
