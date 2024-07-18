export type SharedMap = {
  query: string;
  lowerCaseQuery: string;
  cleanedQuery: string;
  cleanedAndLowerCaseQuery: string;
  cache: {
    tdk?: unknown; // a json, it will be checked by the loader
    nisanyan?: unknown;
    luggat?: unknown;
    benzer?: unknown;
  };
  result: {
    tdk?: unknown; // at the end of the request, if this is different than the cache, it will be updated
    nisanyan?: unknown;
    luggat?: unknown;
    benzer?: unknown;
  };
  forceFetch: {
    benzer?: boolean;
  };
};
