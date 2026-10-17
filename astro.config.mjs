import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://lab.yuhailinlxy.com',
  prefetch: { prefetchAll: true },
  vite: {
    plugins: [tailwindcss()],
  },
});
