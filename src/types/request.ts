export type SharedMap = {
  query: string;
  lowerCaseQuery: string;
  cache: {
    tdk?: unknown; // a json, it will be checked by the loader
  };
  result: {
    tdk?: unknown; // at the end of the request, if this is different than the cache, it will be updated
  };
};
