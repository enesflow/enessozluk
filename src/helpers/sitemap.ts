// src/routes/dynamic-sitemap.xml/create-sitemap.ts

import { HOSTNAME } from "~/helpers/data/hostname";
import type { RequestHandler } from "@builder.io/qwik-city";
import { words } from "~/helpers/data/words";

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

function getRandom<T>(arr: T[], n: number): T[] {
  const result = new Array(n);
  let len = arr.length;
  const taken = new Array(len);
  if (n > len)
    throw new RangeError("getRandom: more elements taken than available");
  while (n--) {
    const x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
}

export function getWordsSitemap(num: number): RequestHandler {
  return (ev) => {
    const siteRoutes = getRandom(words, num).map((word) => `/search/${word}`);

    const sitemap = createSitemap([
      { loc: "/", priority: 1 }, // Manually include the root route
      ...siteRoutes.map((route) => ({
        loc: route,
        priority: 0.9, // Default priority, adjust as needed
      })),
    ]);

    const response = new Response(sitemap, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });

    ev.send(response);
  };
}
