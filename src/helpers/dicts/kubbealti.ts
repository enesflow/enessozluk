import { API_FAILED_TEXT, NO_RESULT } from "#helpers/constants";
import {
  fetchAPI,
  loadCache,
  setSharedMapResult,
  withoutCache,
} from "#helpers/request";
import type { RequestEventBase } from "@builder.io/qwik-city";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import { load } from "cheerio";
import { NISANYAN_ABBREVIATIONS } from "~/components/dicts/nisanyan";
import type {
  KubbealtiError,
  KubbealtiPackage,
  KubbealtiResponse,
} from "~/types/kubbealti";
import {
  KUBBEALTI_VERSION,
  KubbealtiErrorSchema,
  KubbealtiResponseSchema,
} from "~/types/kubbealti";
import { debugAPI } from "../log";
import { perf } from "../time";
import { to } from "../to";
import { buildKubbealtiUrl } from "./url";
import { isDev } from "@builder.io/qwik/build";

const MAX_KUBBEALTI_RESULTS = 3;

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
  return withoutCache(
    e,
    {
      serverDefinedReason: title,
      // items: [],
      url,
      version: KUBBEALTI_VERSION,
      perf: perf(e),
      content: {},
    },
    "kubbealti",
  );
}

const TAGS = {
  "i.": "isim",
  "sıf.": "sıfat",
  "zf.": "zarf",
  "birl.": "birleşik",
  "ve.": "ve",
} as const;

function cleanAuthor(author: string) {
  return author
    .replace(/\.$/, "")
    .replace(/^\(/, "")
    .replace(/\)$/, "")
    .replace(/['’]den$/, "")
    .replace(/['’]dan$/, "")
    .replace(/['’]ten$/, "")
    .replace(/['’]tan$/, "");
}

const cleanseKubbealtiResponse = (
  data: KubbealtiResponse,
): KubbealtiResponse => {
  if (!(1 in data.content)) {
    throw new Error(
      "SERIOUS ERROR: Kubbealti API response is not in the correct format",
    );
  }

  data.content[1] = data.content[1]?.slice(0, MAX_KUBBEALTI_RESULTS);
  data.totalElements = data.content[1]?.length || 0;

  for (const item of data.content[1]!) {
    /* item.anlam = item.anlam
      .replaceAll('href="/s/–', 'href="/s/')
      .replaceAll("href='/s/–", "href='/s/")
      .replaceAll('href="/s/', 'href="/search/')
      .replaceAll("href='/s/", "href='/search/"); */
    const $ = load(
      item.anlam
        .replaceAll("“", '"')
        .replaceAll("”", '"')
        // .replaceAll("&nbsp;", "")
        .replace(/ѻ|●/g, ""),
    );
    // remove the style tag of all elements
    $("*")
      .removeAttr("style")
      .each((_, el) => {
        // if the hrefe starts with /s/ replace it with /search/
        if ((el as any).name === "a") {
          const elem = $(el);
          let href = elem.attr("href");
          // if href's first char is -, remove it
          if (href?.startsWith("-")) {
            href = href.slice(1);
          }
          if (href?.startsWith("/s/")) {
            elem.attr("href", href.replace("/s/", "/search/"));
          }
          // if it doesn't start with it, just add /search/ to the beginning
          else {
            elem.attr("href", "/search/" + href);
          }
        }
      });
    $(".ChampturkI150, .ChampturkI14").each((_, el) => {
      const elem = $(el);
      const tags = elem.text().trim().replaceAll(" ve ", " ve. ").split(" ");
      if (tags.every((tag) => tag.endsWith("."))) {
        elem.text(tags.map((tag) => (TAGS as any)[tag] || tag).join(" ") + " ");
        elem.addClass("tags");
      }
    });
    // replace the language abbrevations
    $(".Champturk14").each((_, el) => {
      Object.entries(NISANYAN_ABBREVIATIONS).forEach(([key, value]) => {
        el.children.forEach((child) => {
          if (child.type === "text") {
            child.data = child.data.replace(key + ".", value);
          }
        });
      });
    });
    // loop over all .ChampturkI150 and print the text
    $(".ChampturkI150").each((_, el) => {
      const elem = $(el);
      let next = elem.next();
      // if elem has a child with the class "Temizle", make it next
      if (elem.children().hasClass("Temizle")) {
        elem.children().each((_, child) => {
          const childElem = $(child);
          if (childElem.hasClass("Temizle")) {
            childElem.addClass("Champturk150");
            next = childElem;
          }
        });
      }
      const nextText = cleanAuthor(next.text().trim());
      if (
        nextText.length >= 6 &&
        next.hasClass("Champturk150") &&
        !elem.hasClass("tags") &&
        !nextText.endsWith('"')
      ) {
        if (next.next().is("br")) {
          next.next().remove();
        }
        // make elem a <p>
        if (nextText.length) {
          next.attr("class", "ml-4");
          elem.append("<br>");
          const em = $("<em>");
          em.attr("class", "ml-4");
          em.text(nextText);
          elem.append(em);
          next.remove();
        }
        elem.replaceWith(
          `<p class="result-quote">${elem.html()?.replaceAll(" / ", "<br/>")}</p>`,
        );
      }
    });
    $(".Champturk150").each((_, el) => {
      // if the text.trim equals "Bk." make the next item a link to /search/{text}
      const elem = $(el);
      const text = elem.text().trim();
      if (text === "Bk.") {
        const next = elem.next();
        if (
          !next.is("a") &&
          // and does not have a child with "a" tag
          !next.children().is("a")
        ) {
          next.replaceWith(
            `<a href="/search/${next.text().toLocaleLowerCase("tr")}">${next.html()}</a>`,
          );
        }
        elem.text("Bakınız: ");
      }
    });
    item.anlam = $.html();
  }
  return data;
};

export const kubbealtiLoader = server$(
  async function (): Promise<KubbealtiPackage> {
    const e = this;
    // If there is data in cache, return it
    const cache = loadCache(e, "kubbealti");
    if (cache && "serverDefinedReason" in cache)
      return setSharedMapResult(e, "kubbealti", cache);
    /////////////////////////////

    const url = buildKubbealtiUrl(e);
    const [error, response] = await to(fetchAPI(url.api));
    // Returns error if request failed
    if (error || !response?.success) {
      debugAPI(e, `Kubbealti API Error: ${error?.message || response?.code}`);
      return buildKubbealtiAPIError(
        e,
        url.user,
        `${API_FAILED_TEXT}: ${error?.message || response?.code}`,
      );
    }
    response.data = {
      ...(response.data as any),
      content:
        "content" in response.data
          ? {
              [1]: response.data.content,
            }
          : undefined,
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
          // items: error.data.items,
          url: url.user,
          version: KUBBEALTI_VERSION,
          perf: perf(e),
          content: {},
        };
        return setSharedMapResult(e, "kubbealti", data);
      }
      // Returns error if parsing failed
      if (!parsed.success) {
        console.log(response.data);
        return buildKubbealtiAPIError(
          e,
          url.user,
          `${API_FAILED_TEXT}: ${parsed.error.message}`,
        );
      }
    } /////////////////////////////
    if (parsed.data.totalElements === 0) {
      return setSharedMapResult(e, "kubbealti", {
        serverDefinedReason: NO_RESULT,
        url: url.user,
        version: KUBBEALTI_VERSION,
        perf: perf(e),
        content: {},
      });
    }
    const data = cleanseKubbealtiResponse(parsed.data);
    // return setSharedMapResult(e, "kubbealti", data);
    if (cache) {
      cache.content[1] = data.content[1];
      return setSharedMapResult(e, "kubbealti", cache);
    } else {
      return setSharedMapResult(e, "kubbealti", {
        ...data,
        content: {
          [1]: data.content[1],
        },
      });
    }
  },
);

// eslint-disable-next-line qwik/loader-location
export const useKubbealtiLoader = routeLoader$<KubbealtiPackage>(async (e) => {
  // if (isDev && DEV_DISABLED.kubbealti)
  // qwik errors on build.server when I uncomment the if statement above
  if (isDev)
    // return buildKubbealtiAPIError(e, "", "Kubbealti is disabled");
    return buildKubbealtiAPIError(e, "", "Kubbealti is disabled");
  return kubbealtiLoader.call(e);
});
