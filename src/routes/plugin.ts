import type { SharedMap } from "#/request";
import { generateUUID } from "#helpers/generateUUID";
import { getRedirect } from "#helpers/redirect";
import type { RequestHandler } from "@builder.io/qwik-city";

export const onRequest: RequestHandler = async ({
  url,
  params,
  redirect,
  next,
  sharedMap,
  clientConn,
}) => {
  if (!params.query) return next();
  const decoded = decodeURIComponent(params.query);
  const cleaned = decoded.replace(/[^a-zA-ZğüşöçıİĞÜŞÖÇ\s]/g, "");
  const data: SharedMap = {
    query: decoded,
    lowerCaseQuery: params.query.toLocaleLowerCase("tr"),
    // remove all + and numbers
    cleanedQuery: cleaned,
    cleanedAndLowerCaseQuery: cleaned.toLocaleLowerCase("tr"),
    cache: {},
    result: {},
  };
  sharedMap.set("data", data);
  sharedMap.set("sessionUUID", generateUUID(clientConn));

  const red = getRedirect(url, {
    query: params.query,
  });
  if (red.shouldRedirect) {
    throw redirect(red.code, red.to);
  }
  await next();
  console.log("This is done");
  console.log(sharedMap.get("data"));
};
