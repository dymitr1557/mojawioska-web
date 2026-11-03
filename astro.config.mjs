// @ts-check
import { defineConfig } from 'astro/config';

// Served from GitHub Pages as a project page. When a custom domain is added,
// set `site` to it, remove `base` and add public/CNAME (see README.md).
export default defineConfig({
  site: 'https://dymitr1557.github.io',
  base: '/wioska-web',
  i18n: {
    locales: ['pl', 'en'],
    defaultLocale: 'pl',
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
