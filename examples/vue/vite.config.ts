import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import WindiCSS from 'vite-plugin-windicss'
import Restart from 'vite-plugin-restart'

export default defineConfig({
  plugins: [
    Vue({
      include: [/\.vue$/, /\.md$/],
    }),
    WindiCSS(),
    Restart({
      restart: ['../../packages/vite-plugin-windicss/dist/*.js'],
    }),
  ],
})
