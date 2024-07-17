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
  if (!red.shouldRedirect) {
    return next();
  } else {
    throw redirect(red.code, red.to);
  }
};
