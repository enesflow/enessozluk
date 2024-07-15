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
