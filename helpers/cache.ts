import type { LuggatPackage } from "#/luggat";
import type { BenzerPackage } from "../types/benzer";
import type {
  NisanyanAffixPackage,
  NisanyanWordPackage,
} from "../types/nisanyan";
import type { TDKPackage } from "../types/tdk";
import { parseBenzer, parseLuggat } from "./parser";
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

const parser = {
  luggat: parseLuggat,
  benzer: parseBenzer,
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
  },
): Promise<{
  data: ProviderType[T];
  isCached: boolean;
  response: Response;
}> {
  const cachedResponse = await checkForCache(options.provider, url);
  if (cachedResponse && !options.forceRefresh) {
    console.log("cache hit", options.provider);
    return {
      data: cachedResponse,
      isCached: true,
      response: new Response(),
    };
  }
  console.log("cache miss", options.provider);
  const response = await fetch(url, options);
  const fn =
    options.provider in parser ? (parser as any)[options.provider] : null;
  const data =
    options.provider in parser
      ? fn(await response.text(), url)
      : ((await response.json()) as ProviderType[T]);
  await setCache(options.provider, url, data);
  return {
    data,
    isCached: false,
    response,
  };
}
