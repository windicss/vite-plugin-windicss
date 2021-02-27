import { UserConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import WindiCSS, { PugTransformer } from 'vite-plugin-windicss'

const config: UserConfig = {
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
}

export default config
