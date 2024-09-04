import type { Dicts } from "#/dicts";
import type { SharedMap } from "#/request";
import type { RequestEventBase } from "@builder.io/qwik-city";
import type { z } from "zod";
import { BenzerPackageSchema } from "~/types/benzer";
import { KubbealtiPackageSchema } from "~/types/kubbealti";
import { LuggatPackageSchema } from "~/types/luggat";
import { NisanyanWordPackageSchema } from "~/types/nisanyan";
import { RhymePackageSchema } from "~/types/rhyme";
import { TDKPackageSchema } from "~/types/tdk";
import { debugAPI, debugLog } from "./log";

export function loadSharedMap(e: RequestEventBase) {
  const data = e.sharedMap.get("data");
  if (!data) {
    throw new Error("'data' not found in sharedMap");
  }
  return data as SharedMap;
}

export function setSharedMapResult<T>(
  e: RequestEventBase,
  dict: Dicts,
  data: T,
): T {
  const sharedMap = loadSharedMap(e);
  (sharedMap.result as any)[dict] = data; // TODO: change this
  e.sharedMap.set("data", sharedMap);
  return data;
}

function buildError(response: Response) {
  if (!response.ok) {
    return new Error(
      `Failed to fetch ${response.url} with status ${response.status} (${response.statusText}): ${response.text()}`,
    );
  }
  return undefined;
}

/**
 * Fetches data from an API endpoint.
 *
 * @param url - The URL of the API endpoint.
 * @param returnType - The expected return type of the API response. Defaults to "json".
 * @param init - Optional request initialization options.
 * @returns A promise that resolves to the API response based on the specified return type.
 */
export async function fetchAPI<T extends "json" | "html" = "json">(
  url: string,
  returnType: T = "json" as T,
  init?: RequestInit,
): Promise<
  | {
      data: T extends "json" ? {} : string;
      success: true;
      code: number;
      raw: Response;
    }
  | {
      success: false;
      error: Error;
      code: number;
      raw: Response;
    }
> {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
  debugLog("Fetching", decodeURI(url));
  const response = await fetch(url, init);
  const error = buildError(response);
  if (error) {
    // throw error
    return {
      success: false,
      code: response.status,
      error,
      raw: response,
    };
  }
  /* return returnType === "json" ? res.json() : res.text(); */
  return {
    success: true,
    code: response.status,
    data: returnType === "json" ? await response.json() : await response.text(),
    raw: response,
  };
}

const Packages = {
  tdk: TDKPackageSchema,
  luggat: LuggatPackageSchema,
  "nisanyan-affix": NisanyanWordPackageSchema,
  benzer: BenzerPackageSchema,
  nisanyan: NisanyanWordPackageSchema,
  kubbealti: KubbealtiPackageSchema,
  rhyme: RhymePackageSchema,
} as const;

export function loadCache<T extends Dicts>(
  e: RequestEventBase,
  dict: T,
): z.infer<(typeof Packages)[T]> | null {
  const sharedMap = loadSharedMap(e);
  const cache = (sharedMap.cache as any)[dict];
  if (cache) {
    const parsed = Packages[dict].safeParse(cache);
    if (parsed.success) {
      debugLog("Using cache for", dict);
      parsed.data.perf = {
        took: 0,
        cached: true,
      };
      return parsed.data;
    } else {
      debugLog("Cache parsing failed for", dict, parsed.error);
      return null;
    }
  } else {
    debugAPI(e, "Cache not found for", dict);
    return null;
  }
}

export function getFakeHeaders() {
  const mostPopularUserAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.37",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.38",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.39",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.40",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.41",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.42",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.43",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.44",
    "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.4 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:45.0) Gecko/20100101 Firefox/45.0",
    "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; AS; rv:11.0) like Gecko",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.4 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36",
  ];

  const acceptLanguages = [
    "en-US,en;q=0.9",
    "en-GB,en;q=0.8",
    "en-US;q=0.7,en;q=0.3",
  ];

  const acceptEncodings = ["gzip, deflate, br", "gzip, deflate"];

  return {
    "user-agent":
      mostPopularUserAgents[
        Math.floor(Math.random() * mostPopularUserAgents.length)
      ],
    "accept-language":
      acceptLanguages[Math.floor(Math.random() * acceptLanguages.length)],
    "accept-encoding":
      acceptEncodings[Math.floor(Math.random() * acceptEncodings.length)],
    "upgrade-insecure-requests": "1",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "sec-fetch-dest": "document",
    "cache-control": "max-age=0",
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  };
}

export function noCache(e: RequestEventBase): void {
  // just 5 seconds, there is probably a temporary issue and a refresh will fix it
  e.cacheControl(
    {
      maxAge: 5,
      staleWhileRevalidate: 5,
    },
    "Cloudflare-CDN-Cache-Control",
  );
}

export function withoutCache<D>(e: RequestEventBase, d: D): D {
  noCache(e);
  const isObject = typeof d === "object" && d !== null;
  console.log(
    "DISABLING CACHE FOR DATA",
    isObject ? ("url" in d ? d.url : d) : d,
  );
  return d;
}
