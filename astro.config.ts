import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://perdomopro.com',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  i18n: {
    defaultLocale: 'es-MX',
    locales: ['es-MX', 'en'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  vite: {
    plugins: [tailwindcss() as any],
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'es-MX',
        locales: {
          'es-MX': 'es-MX',
          en: 'en',
        },
      },
    }),
  ],
});
