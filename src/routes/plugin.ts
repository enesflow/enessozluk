import type { AddL, QueryType, SharedMap } from "#/request";
import { generateUUID } from "#helpers/generateUUID";
import { getRedirect } from "#helpers/redirect";
import type { RequestHandler } from "@builder.io/qwik-city";
import * as compressJSON from "compress-json";
import { getCacheByKey, setCache, updateCache } from "~/helpers/db";
import { sha256 } from "~/helpers/sha256";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { isDev } from "@builder.io/qwik/build";

const CACHE_DISABLED = /* false */ isDev as boolean;

export function clearAccent(str: string): string {
  // other than ı, ü, ö, ç, ş, ğ, İ, Ü, Ö, Ç, Ş, Ğ
  const accents = {
    â: "a",
    Â: "A",
    î: "i",
    Î: "I",
    û: "u",
    Û: "U",
    ê: "e",
    Ê: "E",
  } as Record<string, string>;
  for (const accent in accents) {
    str = str.replace(new RegExp(accent, "g"), accents[accent]);
  }
  return str;
}

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

export function fullyCleanWord(word: string): string {
  // remove numbers, +, (, ), and accent characters and flatten verb
  return clearAccent(
    word
      .trim()
      .toLocaleLowerCase("tr")
      .replace(/[0-9+()]/g, ""),
  );
}

export function getQuery(query: string): SharedMap["query"] {
  function addLowercaseKeys(obj: QueryType): AddL<QueryType> {
    // add "..."L keys to object with "...".toLocaleLowerCase("tr")
    const keys = Object.keys(obj);
    const newObj = {} as any;
    for (const key of keys) {
      newObj[key] = (obj as any)[key];
      newObj[`${key}L`] = (obj as any)[key].toLocaleLowerCase("tr");
    }
    return newObj;
  }
  const rawDecoded = decodeURIComponent(query).trim(); // Decode the url encoded string
  const noNum = rawDecoded.replace(/[0-9]/g, ""); // Remove numbers
  const noNumPlus = noNum.replace(/[+]/g, ""); // Remove +
  const noNumPlusParen = noNumPlus.includes(" ")
    ? noNumPlus
    : noNumPlus.replace(/[()]/g, ""); // Remove ()
  const noNumPlusParenAcc = clearAccent(noNumPlusParen); // Remove accents (â, î, û, ê)
  return addLowercaseKeys({
    raw: query,
    rawDecoded,
    noNum,
    noNumPlus,
    noNumPlusParen,
    noNumPlusParenAcc,
  });
}

export const onRequest: RequestHandler = async (e) => {
  // Only run for /search/[query]
  if (!e.params.query) return e.next();
  const query = getQuery(e.params.query);
  ///////////////////////////////
  const s = new Date().getTime();
  const key = query.rawDecodedL;
  const cache = CACHE_DISABLED ? null : await getCacheByKey(e, key);
  const data: SharedMap = {
    query: getQuery(e.params.query),
    cache: cache ? compressJSON.decompress(JSON.parse(cache.data)) : {},
    result: {},
    forceFetch: {},
    startTime: s,
    cacheTook: new Date().getTime() - s,
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
    console.log("Setting caches for the first time");
    await setCache(e, {
      key,
      data: compressed,
    });
  } else {
    if (cache.hash !== sha256(compressed)) {
      console.log("Updating caches");
      await updateCache(e, {
        key,
        data: compressed,
      });
    } else {
      console.log("Caches are up-to-date");
    }
  }
};
