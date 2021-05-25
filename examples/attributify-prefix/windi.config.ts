import { defineConfig } from 'windicss/helpers'

export default defineConfig({
  attributify: {
    prefix: 'w:',
  },
  alias: {
    'hstack': 'flex items-center',
    'vstack': 'flex flex-col',
    'icon': 'w-6 h-6 fill-current',
    'app': 'text-red',
    'app-border': 'border-gray-200 dark:border-dark-300',
  },
})
