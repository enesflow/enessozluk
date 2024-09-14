import { API_FAILED_TEXT, NO_RESULT } from "#helpers/constants";
import {
  fetchAPI,
  loadCache,
  loadSharedMap,
  setSharedMapResult,
  withoutCache,
} from "#helpers/request";
import type { RequestEventBase } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { DEV_DISABLED } from "~/routes/search/[query]/dev";
import type {
  NNamesError,
  NNamesPackage,
  NNamesResponse,
} from "~/types/nnames";
import {
  NNAMES_VERSION,
  NNamesErrorSchema,
  NNamesResponseSchema,
} from "~/types/nnames";
import { debugAPI } from "../log";
import { perf } from "../time";
import { to } from "../to";
import { buildNisanyanNamesUrl } from "./url";
import { clearAccent } from "~/routes/plugin";

function buildNNamesAPIError(
  e: RequestEventBase,
  url: string,
  title: string,
): NNamesError {
  debugAPI(e, `NNames API Error: ${title}`);
  return withoutCache(e, {
    url,
    version: NNAMES_VERSION,
    perf: perf(e),
    isSuccessful: false,
    serverDefinedError: title,
  });
}

const cleanseNNamesResponse = (e: RequestEventBase, data: NNamesResponse) => {
  const sharedMap = loadSharedMap(e);
  data.names.forEach((name) => {
    if (!name.reference.to.length && name.origin.reference)
      name.reference = name.origin.reference;
    name.origin.reference = undefined;

    if (
      clearAccent(name.name.toLocaleLowerCase("tr")) !==
      sharedMap.query.noNumPlusParenAccL
    )
      name.serverDefinedIsMisspellings = true;
  });
  return data;
};
// eslint-disable-next-line qwik/loader-location
export const useNNamesLoader = routeLoader$<NNamesPackage>(async (e) => {
  if (DEV_DISABLED.nnames)
    return buildNNamesAPIError(e, "", "NNames is disabled");
  // If there is data in cache, return it
  {
    const cache = loadCache(e, "nnames");
    if (cache) return setSharedMapResult(e, "nnames", cache);
  } /////////////////////////////
  // const sharedMap = loadSharedMap(e);
  const url = buildNisanyanNamesUrl(e);
  /* const [error, response] = await to(fetchAPI(url.api)); */
  const [error, response] = await to(fetchAPI(url.api));
  // Returns error if request failed
  if (error || !response?.success) {
    debugAPI(e, `NNames API Error: ${error?.message || response?.code}`);
    return buildNNamesAPIError(
      e,
      url.user,
      `${API_FAILED_TEXT}: ${error?.message || response?.code}`,
    );
  }
  response.data = {
    ...(response.data as NNamesResponse),
    url: url.user,
    version: NNAMES_VERSION,
    perf: perf(e),
  } satisfies NNamesResponse;
  const parsed = NNamesResponseSchema.safeParse(response.data);
  // Error handling
  {
    const error = NNamesErrorSchema.safeParse(response.data);
    if (error.success) {
      return setSharedMapResult(e, "nnames", {
        ...error.data,
        serverDefinedError: NO_RESULT,
      });
    }
    // Returns error if parsing failed
    if (!parsed.success) {
      return buildNNamesAPIError(
        e,
        url.user,
        `${API_FAILED_TEXT}: ${parsed.error.message}`,
      );
    }
  } /////////////////////////////
  const data = cleanseNNamesResponse(e, parsed.data);
  return setSharedMapResult(e, "nnames", data);
});
