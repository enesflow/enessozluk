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
  const data: SharedMap = {
    query: params.query,
    lowerCaseQuery: params.query.toLocaleLowerCase("tr"),
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
