import type { SharedMap } from "#/request";
import { generateUUID } from "#helpers/generateUUID";
import { getRedirect } from "#helpers/redirect";
import type { RequestHandler } from "@builder.io/qwik-city";
import { getCacheByKey, setCache, updateCache } from "~/helpers/db";
import * as compressJSON from "compress-json";
import { sha256 } from "~/helpers/sha256";

export const onRequest: RequestHandler = async (e) => {
  // Only run for /search/[query]
  if (!e.params.query) return e.next();
  ///////////////////////////////
  const decoded = decodeURIComponent(e.params.query);
  const cleaned = decoded.replace(/[^a-zA-ZğüşöçıİĞÜŞÖÇ\s]/g, "");
  const key = decoded.toLocaleLowerCase("tr");
  console.log("env is", e.platform.env);
  console.log("the other env", e.env, e.env.get("DB"));
  const cache = await getCacheByKey(e, key);
  console.log("Cache:", cache);
  const data: SharedMap = {
    query: decoded,
    lowerCaseQuery: e.params.query.toLocaleLowerCase("tr"),
    // remove all + and numbers
    cleanedQuery: cleaned,
    cleanedAndLowerCaseQuery: cleaned.toLocaleLowerCase("tr"),
    cache: cache ? compressJSON.decompress(JSON.parse(cache.data)) : {},
    result: {},
  };
  e.sharedMap.set("data", data);
  e.sharedMap.set("sessionUUID", generateUUID(e.clientConn));

  const red = getRedirect(e.url, {
    query: e.params.query,
  });
  if (red.shouldRedirect) {
    throw e.redirect(red.code, red.to);
  }
  await e.next();
  const result = e.sharedMap.get("data").result;
  const compressed = JSON.stringify(compressJSON.compress(result));
  // set the caches
  if (!cache) {
    console.log("Setting cache");
    await setCache(e, {
      key,
      data: compressed,
    });
  } else {
    if (cache.hash !== sha256(compressed)) {
      await updateCache(e, {
        key,
        data: compressed,
      });
    }
  }
};
