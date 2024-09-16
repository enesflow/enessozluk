import type { AddL, QueryType, SharedMap } from "#/request";
import { generateUUID } from "#helpers/generateUUID";
import { getRedirect } from "#helpers/redirect";
import type { RequestHandler } from "@builder.io/qwik-city";
import * as compressJSON from "compress-json";
import {
  deleteCache,
  getCacheByKey,
  setCache,
  updateCache,
} from "~/helpers/db";
import { sha256 } from "~/helpers/sha256";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { isDev } from "@builder.io/qwik/build";
import { getKubbealtiPage } from "~/helpers/dicts/kubbealti";
import { CACHE_TOTAL_FAILED } from "~/helpers/db_config";
import { loadSharedMap } from "~/helpers/request";

const CACHE_DISABLED = /* false */ isDev as boolean;

export function clearAccent(str: string): string {
  // other than ı, ü, ö, ç, ş, ğ, İ, Ü, Ö, Ç, Ş, Ğ
  const accents = {
    â: "a",
    Â: "A",
    ā: "a",
    Ā: "A",
    î: "i",
    Î: "İ",
    ī: "ı",
    Ī: "I",
    û: "u",
    Û: "U",
    ū: "u",
    Ū: "U",
    ê: "e",
    Ê: "E",
    // ē: "e",
    // Ē: "E",
    // 1st type of quote
    "'": "",
    // 2nd type of quote
    "’": "",
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
  const noNumEtc = noNum.replace(/[+]/g, "").replace(/-$/, "");
  const noNumEtcParen = noNumEtc.includes(" ")
    ? noNumEtc
    : noNumEtc.replace(/[()]/g, ""); // Remove ()
  const noNumEtcParenAcc = clearAccent(noNumEtcParen); // Remove accents (â, î, û, ê)
  return addLowercaseKeys({
    raw: query,
    rawDecoded,
    noNum,
    noNumEtc,
    noNumEtcParen,
    noNumEtcParenAcc,
  });
}

export const onRequest: RequestHandler = async (e) => {
  // Only run for /search/[query]
  if (!e.params.query) return e.next();
  const query = getQuery(e.params.query);
  ///////////////////////////////
  const s = new Date().getTime();
  const kubbealtiPage = getKubbealtiPage(e.url);
  const key = query.rawDecodedL;
  const cache = CACHE_DISABLED ? null : await getCacheByKey(e, key);
  const data: SharedMap = {
    query: getQuery(e.params.query),
    url: {
      kubbealtiPage,
    },
    cache: cache ? compressJSON.decompress(JSON.parse(cache.data)) : {},
    cacheLastUpdated: cache ? cache.time : undefined,
    result: cache ? compressJSON.decompress(JSON.parse(cache.data)) : {},
    forceFetch: {},
    startTime: s,
    cacheTook: new Date().getTime() - s,
  };
  e.sharedMap.set("data", data);
  e.sharedMap.set("sessionUUID", await generateUUID(e.clientConn));

  const red = getRedirect(e.url, {
    query: e.params.query,
  });
  if (red.shouldRedirect) {
    throw e.redirect(red.code, red.to);
  }
  await e.next();

  // if every dict failed, no bother to cache and fill up the db
  const sharedMap = loadSharedMap(e);

  if (!CACHE_TOTAL_FAILED && sharedMap.metaData?.allFailed) {
    // and delete the cache if it exists (to clean up older failed caches)
    console.log("Not caching because all failed, and deleting cache if exists");
    await deleteCache(e, key);
  } else {
    const result = sharedMap.result;
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
      if (cache.hash !== (await sha256(compressed))) {
        console.log("Updating caches");
        await updateCache(e, {
          key,
          data: compressed,
        });
      } else {
        console.log("Caches are up-to-date");
      }
    }
  }
};
