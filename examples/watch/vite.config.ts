import { defineConfig } from 'vite'
import WindiCSS from '../../packages/vite-plugin-windicss/src'

export default defineConfig({
  plugins: [
    WindiCSS(),
  ],
  build: {
    minify: false,
  },
})
