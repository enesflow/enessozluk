// this type takes in a {key: string} sort of thing and for each key, it adds L to the end
// example:

import { routeLoader$ } from "@builder.io/qwik-city";
import { loadSharedMap } from "~/helpers/request";
import type { SearchPageData } from "~/routes/search/[query]/metaData";

// {nice: string, okay: string} -> {nice: string, niceL: string okay: string, okayL: string}
export type AddL<T> = {
  [K in keyof T]: T[K];
} & {
  [K in keyof T as `${K & string}L`]: T[K];
};

export type QueryType = {
  raw: string;
  rawDecoded: string;
  noNum: string;
  noNumEtc: string;
  noNumEtcParen: string;
  noNumEtcParenAcc: string;
};
export type QueryTypeL = AddL<QueryType>;

export type SharedMap = {
  query: AddL<QueryType>;
  url: {
    kubbealtiPage: number;
  };
  cache: {
    tdk?: unknown; // a json, it will be checked by the loader
    nisanyan?: unknown;
    luggat?: unknown;
    benzer?: unknown;
    kubbealti?: unknown;
    rhyme?: unknown;
  };
  cacheLastUpdated?: number;
  result: {
    tdk?: unknown; // at the end of the request, if this is different than the cache, it will be updated
    nisanyan?: unknown;
    luggat?: unknown;
    benzer?: unknown;
    kubbealti?: unknown;
    rhyme?: unknown;
  };
  forceFetch: {
    benzer?: boolean;
  };
  startTime: number;
  cacheTook: number;
  metaData?: SearchPageData;
};

// eslint-disable-next-line qwik/loader-location
export const useQueryLoader = routeLoader$<QueryTypeL>((e) => {
  const sharedMap = loadSharedMap(e);
  return sharedMap.query;
});
