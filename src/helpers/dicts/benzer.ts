import type { RequestEventBase } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { load } from "cheerio";
import { API_FAILED_TEXT, NO_RESULT } from "~/helpers/constants";
import { buildBenzerUrl } from "~/helpers/dicts/url";
import { debugAPI } from "~/helpers/log";
import { fetchAPI, loadCache, setSharedMapResult } from "~/helpers/request";
import { to } from "~/helpers/to";
import type {
  BenzerPackage,
  BenzerResponse,
  BenzerResponseError,
} from "~/types/benzer";
import {
  BenzerResponseErrorSchema,
  BenzerResponseSchema,
} from "~/types/benzer";

function buildBenzerAPIError(
  e: RequestEventBase,
  title: string,
): BenzerResponseError {
  debugAPI(e, `Benzer API Error: ${title}`);
  return {
    serverDefinedErrorText: title,
    isUnsuccessful: true,
  };
}

function parseBenzer(e: RequestEventBase, response: string): BenzerPackage {}

// eslint-disable-next-line qwik/loader-location
export const useBenzerLoader = routeLoader$<BenzerPackage>(async (e) => {
  // If there is data in cache, return it
  {
    const cache = loadCache(e, "benzer");
    if (cache) return setSharedMapResult(e, "benzer", cache);
  } /////////////////////////////
  const url = buildBenzerUrl(e);
  const [error, response] = await to(fetchAPI(url, "html"));
  // Returns error if request failed
  if (error || !response?.success) {
    debugAPI(e, `Benzer API Error: ${error?.message || "No response"}`);
    return buildBenzerAPIError(e, API_FAILED_TEXT);
  }
  const result = parseBenzer(e, response.data);
  const parsed = BenzerResponseSchema.safeParse(result);
  // Error handling
  {
    // Returns recommendations if the response is an error or has no results
    const error = BenzerResponseErrorSchema.safeParse(result);
    if (error.success) {
      const data: BenzerResponseError = {
        serverDefinedErrorText: NO_RESULT,
        isUnsuccessful: true,
      };
      return setSharedMapResult(e, "benzer", data);
    }
    // Returns error if parsing failed
    if (!parsed.success) {
      return buildBenzerAPIError(e, parsed.error.message);
    }
  } /////////////////////////////
  const { data } = parsed;
  return setSharedMapResult(e, "benzer", data);
});
