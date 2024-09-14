import type { RequestHandler } from "@builder.io/qwik-city";
import { getWordsSitemap } from "~/helpers/sitemap";

export const onGet: RequestHandler = (ev) => {
  const numUnknown = ev.params.number;
  // make sure the number is an integer, and min() it with 8000 and max() it with 1
  // if the number is not a valid integer, make it 1000
  const num = Math.min(
    Math.max(
      1,
      isNaN(Number(numUnknown)) || !Number.isInteger(Number(numUnknown))
        ? 1000
        : Number(numUnknown),
    ),
    8000,
  );
  return getWordsSitemap(num)(ev);
};
