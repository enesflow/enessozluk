import { API_FAILED_TEXT, NO_RESULT } from "#helpers/constants";
import {
  fetchAPI,
  loadCache,
  setSharedMapResult
} from "#helpers/request";
import type { RequestEventBase } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { DEV_DISABLED } from "~/routes/search/[query]";
import type {
  KubbealtiError,
  KubbealtiPackage,
  KubbealtiResponse} from "~/types/kubbealti";
import {
  KUBBEALTI_VERSION,
  KubbealtiErrorSchema,
  KubbealtiResponseSchema,
} from "~/types/kubbealti";
import { debugAPI } from "../log";
import { perf } from "../time";
import { to } from "../to";
import { buildKubbealtiUrl } from "./url";
import { load } from "cheerio";


// DONT DELETE THIS YET
// https://eski.lugatim.com/rest/word-search/merhaba
/* const loadTDKRecommendations = async (e: RequestEventBase) => {
  const url = buildTDKRecommendationsUrl(e);
  const [error, response] = await to(fetchAPI(url.api));
  if (error || !response?.success) {
    return buildTDKAPIError(
      e,
      url.user,
      `${API_FAILED_TEXT}: ${error?.message || response?.code}`,
    ).recommendations;
  }
  const data = TDKRecommendationSchema.parse(response.data);
  return data;
}; */

function buildKubbealtiAPIError(
  e: RequestEventBase,
  url: string,
  title: string,
): KubbealtiError {
  debugAPI(e, `Kubbealti API Error: ${title}`);
  return {
    serverDefinedReason: title,
    items: [],
    url,
    version: KUBBEALTI_VERSION,
    perf: perf(e),
  };
}

const cleanseKubbealtiResponse = (data: KubbealtiResponse):KubbealtiResponse  => {
  for (const item of data.content) {
    item.anlam = item.anlam
      .replaceAll('href="/s/–', 'href="/s/')
      .replaceAll("href='/s/–", "href='/s/")
      .replaceAll('href="/s/', 'href="/search/')
      .replaceAll("href='/s/", "href='/search/");
    /* item.anlam = item.anlam.replaceAll("ChampturkI150", "result-quote"); */
    const $ = load(item.anlam);
    /* $(".ChampturkI150").each((i, elem) => {
      const html = $(elem).html();
      const text = $(elem).text().trim();
      console.log("TEXT", text);
      if (text[text.length - 1] === ".") return;
      const attributes = $(elem).attr() as any;
      let {
        class: className,
        ... otherAttributes
      } = attributes;
      className = className.replaceAll("ChampturkI150", "result-quote");
      $(elem).replaceWith(`<li class="${className}" ${otherAttributes}>${html}</li>`);
    });
    $(".Champturk150").each((i, elem) => {
      const html = $(elem).html();
      const text = $(elem).text().trim();
      console.log("TEXT", text);
      if (text.length === 1) return;
      const attributes = $(elem).attr() as any;
      let {
        class: className,
        ... otherAttributes
      } = attributes;
      className = className.replaceAll("Champturk150", "ml-4 result-quote");
      $(elem).replaceWith(`<em class="${className}" ${otherAttributes}>${html}</em>`);
    }); */
    const quotes = [] as { quote: string; author: string }[];
    // .ChampturkI150 classes are the quote's content,
    // every .ChampturkI150 has a .Champturk150 "right after" as a sibling, which is the author
    // So we need to iterate over .ChampturkI150 and get the next .Champturk150
    const wordTypes = {
      "i.": "isim",
      "birl.": "birleşik",
      "sıf.": "sıfat",
    } as Record<string, string>;
    const tags = [] as string[];
    // get the first ChampturkI150, which holds the types
    $(".ChampturkI150").first().text().split(" ").forEach((tag) => {
      const trimmed = tag.trim();
      if (trimmed === "") return;
      tags.push(wordTypes[trimmed] ?? trimmed);
    });
    $(".ChampturkI150").each((i, elem) => {
      let quote = $(elem).text().trim();
      let author = $(elem).next().text().trim();
      if (quote.split(" ").every((word) => word.endsWith("."))) return;
      // if author has a "." at the end, remove it
      if (author[author.length - 1] === ".") author = author.slice(0, -1);
      // from quote, remove “ from the beginning and ” from the end
      quote = quote.replace(/“/, "").replace(/”/, "");

      // remove the paranthesis around the author using regex, replace ( from the start and ) from the end
      author = author.replace(/^\(/, "").replace(/\)$/, "");
      // remove all turkish dan den etc. from the end
      // example: "Ali Veli'den" -> "Ali Veli"
      author = author.replace(/['’]den$/, "").replace(/['’]dan$/, "").replace(/['’]ten$/, "").replace(/['’]tan$/, "");
      quotes.push({ quote, author });
    });
    //console.log("QUOTES", quotes);
    console.log("TAGS", tags);
    // item.anlam = $.html();
    item.serverDefinedQuotes = quotes;
  }
  return data;
};

// eslint-disable-next-line qwik/loader-location
export const useKubbealtiLoader = routeLoader$<KubbealtiPackage>(async (e) => {
  console.log("I am being called");
  if (DEV_DISABLED.kubbealti)
    return buildKubbealtiAPIError(e, "", "Kubbealti is disabled");
  // If there is data in cache, return it
  {
    const cache = loadCache(e, "kubbealti");
    if (cache) return setSharedMapResult(e, "kubbealti", cache);
  } /////////////////////////////
  // const sharedMap = loadSharedMap(e);
  const url = buildKubbealtiUrl(e);
  const [error, response] = await to(fetchAPI(url.api));
  // Returns error if request failed
  if (error || !response?.success) {
    console.log(url);
    debugAPI(e, `Kubbealti API Error: ${error?.message || response?.code}`);
    return buildKubbealtiAPIError(
      e,
      url.user,
      `${API_FAILED_TEXT}: ${error?.message || response?.code}`,
    );
  }
  response.data = {
    ...(response.data as any),
    url: url.user,
    version: KUBBEALTI_VERSION,
    perf: perf(e),
  } satisfies KubbealtiResponse;
  const parsed = KubbealtiResponseSchema.safeParse(response.data);
  // Error handling
  {
    // Returns recommendations if the response is an error or has no results
    const error = KubbealtiErrorSchema.safeParse(response.data);
    if (error.success) {
      const data: KubbealtiError = {
        serverDefinedReason: NO_RESULT,
        items: error.data.items,
        url: url.user,
        version: KUBBEALTI_VERSION,
        perf: perf(e),
      };
      return setSharedMapResult(e, "kubbealti", data);
    }
    // Returns error if parsing failed
    if (!parsed.success) {
      return buildKubbealtiAPIError(
        e,
        url.user,
        `${API_FAILED_TEXT}: ${parsed.error.message}`,
      );
    }
  } /////////////////////////////
  const data = cleanseKubbealtiResponse(parsed.data);
  return setSharedMapResult(e, "kubbealti", data);
});
