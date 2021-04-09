import { defineConfig } from 'windicss/helpers'
import AspectRatio from 'windicss/plugin/aspect-ratio'

export default defineConfig({
  theme: {
    extend: {
      colors: {
        primary: '#125233',
      },
    },
  },
  plugins: [
    AspectRatio,
  ],
})
