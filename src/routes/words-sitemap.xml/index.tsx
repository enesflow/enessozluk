// src/routes/dynamic-sitemap.xml/index.tsx

import type { RequestHandler } from "@builder.io/qwik-city";
import { words } from "~/helpers/data/words";
import { createSitemap } from "./create-sitemap";

export const onGet: RequestHandler = (ev) => {
  // shuffle the words
  const siteRoutes = words
    .sort(() => Math.random() - 0.5)
    .map((word) => `/search/${word}`)
    .slice(0, 8000);

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
