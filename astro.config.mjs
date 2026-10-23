// @ts-check
import { defineConfig } from "astro/config";

/* Deploy anywhere static:
   - Vercel / Netlify / custom domain → no env needed.
   - GitHub Pages project site → set BASE_PATH=/<repo-name> at build time
     (the included workflow does this automatically).
   SITE_URL (optional) overrides src/data/site.ts → profile.siteUrl. */
export default defineConfig({
  site: process.env.SITE_URL || undefined,
  base: process.env.BASE_PATH || "/",
  trailingSlash: "ignore",
  compressHTML: true,
  build: { inlineStylesheets: "always", format: "directory" },
  image: { responsiveStyles: false },
  devToolbar: { enabled: false },
});
