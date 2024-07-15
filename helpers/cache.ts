import type { LuggatPackage } from "#/luggat";
import type { BenzerPackage } from "../types/benzer";
import type {
  NisanyanAffixPackage,
  NisanyanWordPackage,
} from "../types/nisanyan";
import type { TDKPackage } from "../types/tdk";
import { parseBenzer, parseLuggat, parseNisanyan } from "./parser";
export type PROVDIDER_TYPE =
  | "tdk"
  | "nisanyan"
  | "nisanyanaffix"
  | "luggat"
  | "benzer"
  | `general-${string}`;
type ProviderType = {
  tdk: TDKPackage;
  nisanyan: NisanyanWordPackage;
  nisanyanaffix: NisanyanAffixPackage;
  luggat: LuggatPackage;
  benzer: BenzerPackage;
  [key: string]: unknown;
};

const parseHTML = {
  luggat: parseLuggat,
  benzer: parseBenzer,
} as const;

const parseJSON = {
  nisanyan: parseNisanyan,
} as const;

const dumbCache = new Map<
  string,
  {
    data: ProviderType[PROVDIDER_TYPE];
    time: number;
  }
>();

async function checkForCache<T extends PROVDIDER_TYPE>(
  provider: T,
  url: string,
): Promise<ProviderType[T] | null> {
  // this is a dummy function, will be replaced by cloudflare in the future
  const key = `${provider}-${url}`;
  const cache = dumbCache.get(key);
  return (cache?.data as ProviderType[T] | undefined) ?? null;
  // TODO: check if cache is too old
}

async function setCache<T extends PROVDIDER_TYPE>(
  provider: T,
  url: string,
  data: ProviderType[T],
): Promise<void> {
  // this is a dummy function, will be replaced by cloudflare in the future
  const key = `${provider}-${url}`;
  dumbCache.set(key, {
    data,
    time: Date.now(),
  });
}

// this will fetch with cache support
export async function fetchAPI<T extends PROVDIDER_TYPE>(
  url: string,
  options: RequestInit & {
    provider: T;
    forceRefresh?: boolean;
    forceRefreshIf?: (data: ProviderType[T]) => boolean | undefined;
  },
): Promise<{
  data: ProviderType[T];
  isCached: boolean;
  response: Response;
}> {
  const cachedResponse = await checkForCache(options.provider, url);
  if (cachedResponse && !options.forceRefresh) {
    if (!options.forceRefreshIf?.(cachedResponse)) {
      console.log("cache hit", options.provider);
      return {
        data: cachedResponse,
        isCached: true,
        response: new Response(),
      };
    } else {
      console.log("Forcing a refresh", options.provider);
    }
  }
  console.log("cache miss", options.provider);
  const response = await fetch(url, options);
  const htmlParser = (parseHTML as any)[options.provider];
  const jsonParser = (parseJSON as any)[options.provider];
  const data = htmlParser
    ? htmlParser(await response.text(), url)
    : jsonParser
      ? jsonParser(await response.json(), url)
      : ((await response.json()) as ProviderType[T]);
  await setCache(options.provider, url, data);
  return {
    data,
    isCached: false,
    response,
  };
}
