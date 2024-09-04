import type { RequestHandler } from "@builder.io/qwik-city";

const ONE_SECOND = 1;
const ONE_MINUTE = 60 * ONE_SECOND;
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;

export const onGet: RequestHandler = async ({ cacheControl }) => {
  cacheControl({
    maxAge: ONE_DAY,
    sMaxAge: ONE_DAY,
    staleWhileRevalidate: 15 * ONE_MINUTE,
  });
};
