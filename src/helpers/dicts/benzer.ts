import type { RequestEventBase } from "@builder.io/qwik-city";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import { load } from "cheerio";
import { API_FAILED_TEXT, DID_YOU_MEAN, NO_RESULT } from "~/helpers/constants";
import { buildBenzerUrl } from "~/helpers/dicts/url";
import { debugAPI } from "~/helpers/log";
import {
  fetchAPI,
  getFakeHeaders,
  loadCache,
  loadSharedMap,
  setSharedMapResult,
} from "~/helpers/request";
import { to } from "~/helpers/to";
import type { BenzerPackage, BenzerResponseError } from "~/types/benzer";
import {
  BenzerResponseErrorSchema,
  BenzerResponseSchema,
} from "~/types/benzer";

function buildBenzerAPIError(
  e: RequestEventBase,
  url: string,
  title: string,
): BenzerResponseError {
  debugAPI(e, `Benzer API Error: ${title}`);
  return {
    names: [],
    url,
    serverDefinedErrorText: title,
    isUnsuccessful: true,
  };
}

function parseBenzer(
  e: RequestEventBase,
  url: string,
  response: string,
): BenzerPackage {
  const sharedMap = loadSharedMap(e);
  const query = sharedMap.query;
  const $ = load(response);

  // Extract words from the first list
  const words = new Set<string>();
  const entryContentMain = $(".entry-content-main ul li a");

  if (entryContentMain.length === 0) {
    const isCaptcha = $(
      "body > main > div.page > div > div.page-main > div > div.page-content > div > form > div > span:nth-child(2) > span > button",
    ).length;
    if (isCaptcha) {
      return {
        names: [query],
        url,
        isUnsuccessful: true,
        serverDefinedCaptchaError: true,
        serverDefinedErrorText:
          "Lütfen yukarıdan robot olmadığınızı doğrulayın.",
        words: ["Tekrar", "dene-", query],
      };
    }
    const suggestionBox = $(".suggestion-box > ul:nth-child(2) li a");
    if (suggestionBox.length === 0) {
      return {
        names: [query],
        url,
        isUnsuccessful: true,
      };
    }
    const words = suggestionBox.toArray().map((element) => $(element).text());
    const didYouMeanWord = words.find(
      (word) =>
        query.toLocaleLowerCase("tr") === word.toLocaleLowerCase("tr") &&
        word !== query,
    );
    if (didYouMeanWord) {
      return {
        names: [query],
        url,
        isUnsuccessful: true,
        serverDefinedErrorText: DID_YOU_MEAN,
        serverDefinedReFetchWith: didYouMeanWord,
        words: [didYouMeanWord],
      };
    }
    return {
      names: [query],
      url,
      isUnsuccessful: true,
      words,
    };
  }

  entryContentMain.each((_, element) => {
    words.add($(element).text());
  });

  // Extract more words from the second list
  const moreWords: { [key: string]: string[] } = {};
  $(".entry-content-sub").each((_, element) => {
    const category = $(element)
      .find(".entry-content-sub-title a")
      .first()
      .text();
    const categoryWords = $(element)
      .find(".entry-content-sub-content ul li a")
      .toArray()
      .map((elem) => $(elem).text())
      .filter((text) => !words.has(text) && text !== query)
      .sort((a, b) => a.localeCompare(b, "tr"));
    moreWords[category] = categoryWords;
  });

  if (words.size === 0) {
    return {
      names: [query],
      url,
      isUnsuccessful: true,
      serverDefinedErrorText: NO_RESULT,
    };
  }

  return {
    names: [query],
    url,
    isUnsuccessful: false,
    words: Array.from(words),
    moreWords,
  };
}

export const benzerLoader = server$(async function (): Promise<BenzerPackage> {
  const e = this;
  const sharedMap = loadSharedMap(e);
  // If there is data in cache, return it
  console.log("Force fetch is", sharedMap.forceFetch.benzer);
  if (!sharedMap.forceFetch.benzer) {
    const cache = loadCache(e, "benzer") as BenzerPackage | null;
    if (cache) {
      console.log("cache names", sharedMap.cleanedQuery, (cache as any).names);
      if (
        !("names" in cache ? cache.names : []).includes(sharedMap.cleanedQuery)
      ) {
        // This means the casing between the query and the cache is different
        // we will refetch the data, append it to the cache and return it
        e.sharedMap.set("data", {
          ...sharedMap,
          forceFetch: {
            ...sharedMap.forceFetch,
            benzer: true,
          },
        });
        const fetched = await benzerLoader.call(e);
        const newWords = [...(cache.words ?? []), ...(fetched.words ?? [])];
        const newNames = [
          ...("names" in cache ? cache.names : []),
          ...("names" in fetched ? fetched.names : []),
        ];
        const newMoreWords = {
          ...("moreWords" in cache ? cache.moreWords : {}),
          ...("moreWords" in fetched ? fetched.moreWords : {}),
        };
        return setSharedMapResult(e, "benzer", {
          ...cache,
          isUnsuccessful:
            newWords.length > 0 || Object.keys(newMoreWords).length > 0,
          words: newWords,
          names: newNames,
          moreWords: newMoreWords,
        });
      }
      return setSharedMapResult(e, "benzer", cache);
    }
  } /////////////////////////////

  // We do some cookie manupulation so that we don't hit the captcha too often
  const cookieText = Object.entries(e.cookie)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
  //////////////////
  const url = buildBenzerUrl(e);
  const [error, response] = await to(
    fetchAPI(url.api, "html", {
      ...e.request,
      headers: {
        // disguise as a browser
        ...e.request.headers,
        ...getFakeHeaders(),
        "x-real-ip": e.clientConn.ip,
        cookie: cookieText,
      },
    }),
  );
  // Returns error if request failed
  if (error || !response?.success) {
    debugAPI(e, `Benzer API Error: ${error?.message || "No response"}`);
    return buildBenzerAPIError(e, url.user, API_FAILED_TEXT);
  }
  // We set the cookies
  response.raw.headers
    .get("set-cookie")
    ?.split("; ")
    .forEach((cookieT) => {
      const [key, value] = cookieT.split("=");
      key && value && e.cookie.set(key, value, { path: "/" });
    });
  /////////////////////
  const result = parseBenzer(e, url.user, response.data);
  const parsed = BenzerResponseSchema.safeParse(result);
  // Error handling
  {
    // Returns recommendations if the response is an error or has no results
    const error = BenzerResponseErrorSchema.safeParse(result);
    if (error.success) {
      if (error.data.serverDefinedReFetchWith) {
        sharedMap.query = error.data.serverDefinedReFetchWith;
        e.sharedMap.set("data", sharedMap);
        return benzerLoader.call(e);
      }
      if (error.data.serverDefinedCaptchaError) return error.data;
      else return setSharedMapResult(e, "benzer", error.data);
    }
    // Returns error if parsing failed
    if (!parsed.success) {
      return buildBenzerAPIError(e, url.user, parsed.error.message);
    }
  } /////////////////////////////
  const { data } = parsed;
  return setSharedMapResult(e, "benzer", data);
});

// eslint-disable-next-line qwik/loader-location
export const useBenzerLoader = routeLoader$<BenzerPackage>(async (e) => {
  return benzerLoader.call(e);
});
