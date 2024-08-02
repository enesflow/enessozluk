import type { RequestHandler } from "@builder.io/qwik-city";
export const onGet: RequestHandler = async ({ cacheControl }) => {
  cacheControl(
    {
      // Always serve a cached response by default, up to a week stale
      staleWhileRevalidate: 60 * 60 * 24 * 7,
      // Max once every 5 seconds, revalidate on the server to get a fresh version of this page
      maxAge: 5,
    },
    "Cloudflare-CDN-Cache-Control",
  );
};
