// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://abrahamzhong.com',
  // Pages build to /projects/tars.html etc.; vercel.json's cleanUrls serves them as /projects/tars
  build: { format: 'file' },
  trailingSlash: 'never',
  // Fetch linked pages (like the project pages) as their links scroll into view, so clicks open instantly
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
});
