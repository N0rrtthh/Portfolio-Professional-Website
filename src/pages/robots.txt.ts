import type { APIRoute } from "astro";
import { profile } from "../data/site";

export const GET: APIRoute = () => {
  const site = (import.meta.env.SITE || profile.siteUrl).replace(/\/$/, "");
  const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
  const lines = ["User-agent: *", "Allow: /"];
  if (site) lines.push(`Sitemap: ${site}${base}sitemap.xml`);
  return new Response(lines.join("\n") + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
