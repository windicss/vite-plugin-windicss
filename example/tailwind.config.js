module.exports = {
  variants: {
    extend: {
      cursor: ['disabled'],
      backgroundColor: ['disabled'],
      borderColor: ['active', 'disabled'],
      textColor: ['active', 'disabled'],
      opacity: ['dark', 'active', 'disabled'],
    },
  },
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        teal: {
          100: '#096',
        },
      },
    },
  },
}
