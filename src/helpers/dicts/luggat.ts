import type { RequestEventBase } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { load } from "cheerio";
import { API_FAILED_TEXT, NO_RESULT } from "~/helpers/constants";
import { buildLuggatUrl } from "~/helpers/dicts/url";
import { debugAPI } from "~/helpers/log";
import { fetchAPI, loadCache, setSharedMapResult } from "~/helpers/request";
import { to } from "~/helpers/to";
import type {
  LuggatPackage,
  LuggatResponse,
  LuggatResponseError,
} from "~/types/luggat";
import {
  LuggatResponseErrorSchema,
  LuggatResponseSchema,
} from "~/types/luggat";

function buildLuggatAPIError(
  e: RequestEventBase,
  url: string,
  title: string,
): LuggatResponseError {
  debugAPI(e, `Luggat API Error: ${title}`);
  return {
    url,
    serverDefinedErrorText: title,
    isUnsuccessful: true,
  };
}

function parseLuggat(
  e: RequestEventBase,
  url: string,
  response: string,
): LuggatPackage {
  try {
    const $ = load(response);
    const words: LuggatResponse["words"] = [];
    const wordElements = $(".arama-sonucu-div");
    if (wordElements.length === 0) {
      return {
        url,
        isUnsuccessful: true,
        serverDefinedErrorText: NO_RESULT,
      };
    }
    wordElements.each((_, element) => {
      const name = $(element)
        .find("h2.heading-5")
        .text()
        .trim()
        .replace(/\s+/g, " ");
      const definitions = $(element)
        .find("ol li")
        .map((_, li) => $(li).text().trim())
        .get();
      if (!definitions.length) {
        const potentialDefinition = $(element)
          .contents()
          .filter((_, node) => node.type === "text")
          .text()
          .trim();
        if (potentialDefinition) definitions.push(potentialDefinition);
      }
      if (name && definitions.length) words.push({ name, definitions });
    });
    return {
      url,
      isUnsuccessful: false,
      // Consolidate entries
      words: ((words: LuggatResponse["words"]): LuggatResponse["words"] => {
        const result = new Map<string, string[]>();
        words.forEach((word) => {
          const key = word.name
            .split("/")
            .map((w) => w.trim())
            .filter((w) => w)
            .join(" / ");
          result.set(key, [...(result.get(key) || []), ...word.definitions]);
        });
        return Array.from(result, ([name, definitions]) => ({
          name,
          definitions: Array.from(new Set(definitions.map((d) => d.trim()))),
        }));
      })(words),
    };
  } catch (error) {
    return buildLuggatAPIError(e, url, API_FAILED_TEXT);
  }
}

// eslint-disable-next-line qwik/loader-location
export const useLuggatLoader = routeLoader$<LuggatPackage>(async (e) => {
  // If there is data in cache, return it
  {
    const cache = loadCache(e, "luggat");
    if (cache) return setSharedMapResult(e, "luggat", cache);
  } /////////////////////////////
  const url = buildLuggatUrl(e);
  const [error, response] = await to(fetchAPI(url, "html"));
  // Returns error if request failed
  if (error || !response?.success) {
    debugAPI(e, `Luggat API Error: ${error?.message || "No response"}`);
    // if 4xx, return no result
    if (response?.code && Math.floor(response.code / 100) === 4) {
      return setSharedMapResult(e, "luggat", {
        serverDefinedErrorText: NO_RESULT,
        isUnsuccessful: true,
      });
    } else {
      return buildLuggatAPIError(e, url, API_FAILED_TEXT);
    }
  }
  const result = parseLuggat(e, url, response.data);
  const parsed = LuggatResponseSchema.safeParse(result);
  // Error handling
  {
    // Returns recommendations if the response is an error or has no results
    const error = LuggatResponseErrorSchema.safeParse(result);
    if (error.success) {
      /* const data: LuggatResponseError = {
        serverDefinedErrorText: NO_RESULT,
        isUnsuccessful: true,
      };
      return setSharedMapResult(e, "luggat", data); */
      return setSharedMapResult(e, "luggat", error.data);
    }
    // Returns error if parsing failed
    if (!parsed.success) {
      return buildLuggatAPIError(e, url, parsed.error.message);
    }
  } /////////////////////////////
  const { data } = parsed;
  return setSharedMapResult(e, "luggat", data);
});
