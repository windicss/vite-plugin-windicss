import { join } from 'node:path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import WindiCSS from 'vite-plugin-windicss'
import Restart from 'vite-plugin-restart'

export default defineConfig({
  plugins: [
    Vue({
      include: [/\.vue$/, /\.md$/],
    }),
    WindiCSS({
      onOptionsResolved: (options) => {
        options.scanOptions.extraTransformTargets.css.push(join(__dirname, 'excluded', 'included.css'))
      },
    }),
    Restart({
      restart: ['../../packages/vite-plugin-windicss/dist/*.js'],
    }),
  ],
})
