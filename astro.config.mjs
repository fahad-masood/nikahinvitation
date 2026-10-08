import { defineConfig } from 'astro/config';

// Social crawlers need an absolute URL. Static hosts provide these automatically;
// set SITE_URL to the final custom domain when one is configured.
const site = process.env.SITE_URL || process.env.URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined);
if (site && !/^https?:\/\//.test(site)) throw new Error('SITE_URL must be an absolute https:// URL.');

export default defineConfig({
  output: 'static',
  site,
  build: { format: 'directory' },
  compressHTML: true,
});
