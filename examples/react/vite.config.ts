import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import WindiCSS from 'vite-plugin-windicss'

export default defineConfig({
  plugins: [
    reactRefresh(),
    WindiCSS({
      safelist: 'no-select',
    }),
  ],
  build: {
    sourcemap: true,
  },
})
