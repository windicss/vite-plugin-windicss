import { defineConfig } from 'windicss/helpers';

export default defineConfig({
  preflight: false,
  extract: {
    include: ['**/*.{html,jsx,tsx}'],
    exclude: ['.git', '.ice', 'node_modules', 'build'],
  },
  attributify: true,
  shortcuts: {
    btn: 'rounded-lg border border-gray-300 text-gray-100 bg-blue-500 px-4 py-2 m-2 inline-block hover:shadow cursor-pointer',
  },
});
