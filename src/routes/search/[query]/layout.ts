import type { RequestHandler } from "@builder.io/qwik-city";
export const onGet: RequestHandler = async ({ cacheControl }) => {
  cacheControl(
    {
      staleWhileRevalidate: 60 * 60 * 24 * 30,
      maxAge: 60 * 60 * 24,
      public: true,
    },
    "Cloudflare-CDN-Cache-Control",
  );
};
