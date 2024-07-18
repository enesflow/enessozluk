import type { SharedMap } from "#/request";
import { generateUUID } from "#helpers/generateUUID";
import { getRedirect } from "#helpers/redirect";
import type { RequestHandler } from "@builder.io/qwik-city";
import { getCacheByKey, setCache, updateCache } from "~/helpers/db";
import * as compressJSON from "compress-json";
import { sha256 } from "~/helpers/sha256";

function filterForJson(obj: any): any {
  if (obj === null || typeof obj === "undefined") {
    return null; // Handle null and undefined values explicitly
  }

  if (typeof obj === "function") {
    return; // Discard functions entirely
  }

  // Handle arrays and objects recursively
  if (Array.isArray(obj)) {
    return obj.map(filterForJson);
  } else if (typeof obj === "object") {
    const filteredObject = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = filterForJson(obj[key]);
        if (value !== undefined) {
          // Only add non-undefined values
          (filteredObject as any)[key] = value;
        }
      }
    }
    return filteredObject;
  }

  // Return primitive values (strings, numbers, booleans)
  return obj;
}

export const onRequest: RequestHandler = async (e) => {
  // Only run for /search/[query]
  if (!e.params.query) return e.next();
  ///////////////////////////////
  const decoded = decodeURIComponent(e.params.query);
  const cleaned = decoded.replace(/[\d+]/g, "");
  const key = decoded.toLocaleLowerCase("tr");
  const cache = await getCacheByKey(e, key);
  const data: SharedMap = {
    query: decoded,
    lowerCaseQuery: e.params.query.toLocaleLowerCase("tr"),
    // remove all + and numbers
    cleanedQuery: cleaned,
    cleanedAndLowerCaseQuery: cleaned.toLocaleLowerCase("tr"),
    cache: cache ? compressJSON.decompress(JSON.parse(cache.data)) : {},
    result: {},
    forceFetch: {},
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
  const compressed = JSON.stringify(
    compressJSON.compress(filterForJson(result)),
  );
  // set the caches
  if (!cache) {
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
