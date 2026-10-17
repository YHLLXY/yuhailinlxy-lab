import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://lab.yuhailinlxy.com',
  integrations: [sitemap()],
  prefetch: { prefetchAll: true },
  vite: {
    plugins: [tailwindcss()],
  },
});
