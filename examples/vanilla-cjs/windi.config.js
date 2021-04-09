/* eslint-disable @typescript-eslint/no-var-requires */
const { defineConfig } = require('windicss/helpers')

module.exports = defineConfig({
  theme: {
    extend: {
      colors: {
        primary: '#125233',
      },
    },
  },
  plugins: [
    require('windicss/plugin/aspect-ratio'),
  ],
})
