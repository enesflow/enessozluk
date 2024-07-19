import type { RequestEventBase } from "@builder.io/qwik-city";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import type { CheerioAPI } from "cheerio";
import { load } from "cheerio";
import { API_FAILED_TEXT, DID_YOU_MEAN, NO_RESULT } from "~/helpers/constants";
import { buildBenzerUrl } from "~/helpers/dicts/url";
import { debugAPI } from "~/helpers/log";
import { fetchAPI, getFakeHeaders, loadSharedMap } from "~/helpers/request";
import { to } from "~/helpers/to";
import type {
  BenzerPackage,
  BenzerResponseError,
  BenzerWord,
} from "~/types/benzer";
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
    url,
    serverDefinedErrorText: title,
    isUnsuccessful: true,
  };
}

function checkCaptcha($: CheerioAPI, url: string): BenzerResponseError | null {
  const path =
    "body > main > div.page > div > div.page-main > div > div.page-content > div > form > div > span:nth-child(2) > span > button";
  const isCaptcha = $(path).length;
  if (isCaptcha) {
    return {
      url,
      serverDefinedCaptchaError: true,
      serverDefinedErrorText: "Lütfen yukarıdan robot olmadığınızı doğrulayın.",
      isUnsuccessful: true,
    };
  }
  return null;
}

async function getBenzerRecommendations(
  e: RequestEventBase,
): Promise<BenzerPackage> {
  const sharedMap = loadSharedMap(e);
  // the word is, only the first and the last letters are uppercased
  /* const query =
    sharedMap.lowerCaseQuery[0].toLocaleUpperCase("tr") +
    sharedMap.lowerCaseQuery.slice(1, -1) +
    sharedMap.lowerCaseQuery.slice(-1).toLocaleUpperCase("tr"); */
  // if the query is 2 letters, make the last letter uppercase,
  // otherwise make the first and the last letters uppercase
  // examples:
  //  - su -> sU
  //  - dikili -> Dikilİ
  //  - bayındır -> BayındıR
  //  - ok -> oK
  const query =
    (sharedMap.lowerCaseQuery.length > 2
      ? sharedMap.lowerCaseQuery[0].toLocaleUpperCase("tr")
      : sharedMap.lowerCaseQuery[0]) +
    sharedMap.lowerCaseQuery.slice(1, -1) +
    sharedMap.lowerCaseQuery.slice(-1).toLocaleUpperCase("tr");
  const url = buildBenzerUrl(query);
  // this way we don't see the results but we see the recommendations
  const [error, response] = await to(
    fetchAPI(url.api, "html", {
      ...e.request,
      headers: {
        ...e.request.headers,
        ...getFakeHeaders(),
        "x-real-ip": e.clientConn.ip,
      },
    }),
  );
  if (error || !response?.success) {
    debugAPI(e, `Benzer API Error: ${error?.message || "No response"}`);
    return buildBenzerAPIError(e, url.user, API_FAILED_TEXT);
  }
  const $ = load(response.data);
  const captchaError = checkCaptcha($, url.user);
  if (captchaError) return captchaError;
  // this has surely failed, so we will return the recommendations
  const suggestionBox = $(".suggestion-box > ul:nth-child(2) li a");
  if (suggestionBox.length === 0) {
    return {
      url: buildBenzerUrl(query).user,
      isUnsuccessful: true,
    };
  }
  const words = suggestionBox.toArray().map((element) => $(element).text());
  return {
    isUnsuccessful: true,
    url: url.user,
    words: words.filter(
      (word) => word.toLocaleLowerCase("tr") === sharedMap.lowerCaseQuery,
    ),
  };
}

function parseBenzer(
  e: RequestEventBase,
  name: string,
  url: string,
  response: string,
): BenzerPackage {
  const $ = load(response);

  // Extract words from the first list
  const words = new Set<string>();
  const entryContentMain = $(".entry-content-main ul li a");

  const meaning = $(
    "body > main > div.page > div > div.page-main > div > div.entry > div.entry-content > div.entry-meaning",
  )
    .text()
    .trim();

  if (entryContentMain.length === 0) {
    const isCaptcha = $(
      "body > main > div.page > div > div.page-main > div > div.page-content > div > form > div > span:nth-child(2) > span > button",
    ).length;
    if (isCaptcha) {
      return {
        url,
        isUnsuccessful: true,
        serverDefinedCaptchaError: true,
        serverDefinedErrorText:
          "Lütfen yukarıdan robot olmadığınızı doğrulayın.",
        words: ["Tekrar", "dene-", name],
      };
    }
    const suggestionBox = $(".suggestion-box > ul:nth-child(2) li a");
    if (suggestionBox.length === 0) {
      return {
        meaning,
        url,
        isUnsuccessful: true,
      };
    }
    const words = suggestionBox.toArray().map((element) => $(element).text());
    const didYouMeanWord = words.find(
      (word) =>
        name.toLocaleLowerCase("tr") === word.toLocaleLowerCase("tr") &&
        word !== name,
    );
    if (didYouMeanWord) {
      return {
        meaning,
        url,
        isUnsuccessful: true,
        serverDefinedErrorText: DID_YOU_MEAN,
        serverDefinedReFetchWith: didYouMeanWord,
        words: [didYouMeanWord],
      };
    }
    return {
      meaning,
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
      .filter((text) => !words.has(text) && text !== name)
      .sort((a, b) => a.localeCompare(b, "tr"));
    moreWords[category] = categoryWords;
  });
  if (words.size === 0) {
    return {
      meaning,
      url,
      isUnsuccessful: true,
      serverDefinedErrorText: NO_RESULT,
    };
  }

  return {
    isUnsuccessful: false,
    words: [
      {
        url,
        name,
        meaning,
        words: Array.from(words),
        moreWords,
      },
    ],
  };
}

const loadBenzerWord = server$(async function (word: string): Promise<{
  word: BenzerWord;
  cookie: string | undefined;
} | null> {
  const e = this;
  const cookieText = Object.entries(e.cookie)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
  //////////////////
  const url = buildBenzerUrl(word);
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
    return null;
  }
  const newCookie = response.raw.headers
    .get("set-cookie")
    ?.split("; ")
    .map((cookieT) => {
      const [key, value] = cookieT.split("=");
      return key && value ? `${key}=${value}` : "";
    })
    .join("; ");
  const result = parseBenzer(e, word, url.user, response.data);
  const parsed = BenzerResponseSchema.safeParse(result);
  // Error handling
  {
    // Returns recommendations if the response is an error or has no results
    const error = BenzerResponseErrorSchema.safeParse(result);
    if (error.success) {
      return {
        word: {
          name: word,
          url: error.data.url,
          meaning: error.data.meaning ?? "...",
          words: [],
          moreWords: {},
        },
        cookie: newCookie,
      };
    }
    // Returns error if parsing failed
    if (!parsed.success) {
      return null;
    }
  } /////////////////////////////∏
  const { data } = parsed;
  return {
    word: data.words[0],
    cookie: newCookie,
  };
});

export const benzerLoader = server$(async function (): Promise<BenzerPackage> {
  const rec = await getBenzerRecommendations(this);
  if (!rec.words?.length || !rec.isUnsuccessful) return rec;
  const loaded = await Promise.all(
    rec.words.map((word) => loadBenzerWord.call(this, word)),
  );
  const newCookies = loaded.map((word) => word?.cookie).filter((c) => c);
  newCookies.forEach((cookie) => {
    cookie?.split("; ").forEach((cookieT) => {
      const [key, value] = cookieT.split("=");
      key && value && this.cookie.set(key, value, { path: "/" });
    });
  });
  return {
    isUnsuccessful: false,
    words: loaded.filter((word) => word !== null).map((word) => word!.word),
  };
});

// eslint-disable-next-line qwik/loader-location
export const useBenzerLoader = routeLoader$<BenzerPackage>(async (e) => {
  return benzerLoader.call(e);
});
