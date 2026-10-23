import type { APIRoute } from "astro";
import { profile } from "../data/site";

/* One-page site: the sitemap lists the home page once a production URL is
   known (SITE_URL or profile.siteUrl). Without one it is an empty, valid set. */
export const GET: APIRoute = () => {
  const site = (import.meta.env.SITE || profile.siteUrl).replace(/\/$/, "");
  const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
  const today = new Date().toISOString().slice(0, 10);
  const urls = site ? `  <url><loc>${site}${base}</loc><lastmod>${today}</lastmod></url>\n` : "";
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
