// src/routes/dynamic-sitemap.xml/create-sitemap.ts

import { HOSTNAME } from "~/helpers/data/hostname";

export interface SitemapEntry {
  loc: string;
  priority: number;
}

export function createSitemap(entries: SitemapEntry[]) {
  const baseUrl = HOSTNAME;

  return `
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map(
  (entry) => `
    <url>
        <loc>${baseUrl}${entry.loc.startsWith("/") ? "" : "/"}${entry.loc}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
    </url>`,
)}
</urlset>`.trim();
}
