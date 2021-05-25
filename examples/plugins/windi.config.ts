import { defineConfig } from 'windicss/helpers'
import AspectRatio from 'windicss/plugin/aspect-ratio'
import Typography from 'windicss/plugin/typography'

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
    Typography({
      rtl: true,
    }),
  ],
})
