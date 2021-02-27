import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import WindiCSS, { PugTransformer } from 'vite-plugin-windicss'

export default defineConfig({
  plugins: [
    Vue({
      include: [/\.vue$/, /\.md$/],
    }),
    WindiCSS({
      safelist: 'no-select',
      scan: {
        transformers: [
          PugTransformer(),
        ],
      },
    }),
  ],
})
