import type { RequestEventBase } from "@builder.io/qwik-city";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import type { CheerioAPI } from "cheerio";
import { load } from "cheerio";
import { API_FAILED_TEXT, NO_RESULT } from "~/helpers/constants";
import { buildBenzerAdvancedUrl, buildBenzerUrl } from "~/helpers/dicts/url";
import { debugAPI } from "~/helpers/log";
import {
  fetchAPI,
  getFakeHeaders,
  loadCache,
  loadSharedMap,
  setSharedMapResult,
} from "~/helpers/request";
import { to } from "~/helpers/to";
import { clearAccent } from "~/routes/plugin";
import type {
  BenzerPackage,
  BenzerResponseError,
  BenzerWord,
} from "~/types/benzer";
import {
  BenzerResponseErrorSchema,
  BenzerResponseSchema,
} from "~/types/benzer";
import { nonNullable } from "../filter";

export const CAPTCHA_PATH =
  "body > main > div.page > div > div.page-main > div > div.page-content > div > form > div > span:nth-child(2) > span > button";

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
  const path = CAPTCHA_PATH;
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

// Example: if the user searched for "ama"
// we will search for all the words in this form: _m_
// and we will filter them so that without the accents they are equal to "ama"
// in this case we get "ama" (but) and "âmâ" (blind)
async function getBenzerWordForms(e: RequestEventBase): Promise<
  | BenzerResponseError
  | {
      isUnsuccessful: false;
      words: string[];
    }
> {
  const sharedMap = loadSharedMap(e);
  const query = sharedMap.query.cleaned;
  if (query.length === 1) {
    return {
      isUnsuccessful: false,
      words: [query, query.toLocaleUpperCase("tr")],
    };
  }
  const url = buildBenzerAdvancedUrl(e);
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
  const captcha = checkCaptcha($, url.user);
  if (captcha) return captcha;
  const results = $(
    "body > main > div.page > div > div.page-main > div > div.page-content > div.entries.entries-filtered",
  )
    .find("ul")
    .toArray();
  if (results.length === 0) {
    return {
      isUnsuccessful: false,
      words: [sharedMap.query.cleaned],
    };
  }
  // find all the li a inside all the ul elements and get their text
  const words = results
    .map((result) =>
      $(result)
        .find("li a")
        .toArray()
        .map((element) => $(element).text().trim()),
    )
    .flat()
    .filter(
      (word) =>
        word.length === query.length &&
        clearAccent(word.toLocaleLowerCase("tr")) ===
          sharedMap.query.noAccentLower,
    )
    .sort((a, b) => a.localeCompare(b, "tr"));
  return {
    isUnsuccessful: false,
    words: words.length ? words : [sharedMap.query.cleaned],
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
    const captcha = checkCaptcha($, url);
    if (captcha) return captcha;
    const suggestionBox = $(".suggestion-box > ul:nth-child(2) li a");
    if (suggestionBox.length === 0) {
      return {
        isUnsuccessful: false,
        words: [
          {
            name,
            meaning,
            words: [],
            moreWords: {},
            url,
          },
        ],
      };
    }
    const words = suggestionBox.toArray().map((element) => $(element).text());
    return {
      url,
      isUnsuccessful: true,
      words,
    };
  }

  entryContentMain.each((_, element) => {
    words.add($(element).text());
  });
  const wordsArray = Array.from(words);
  words.add(name);

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
      // .filter((text) => !words.has(text) && text !== name)
      // also add to words if not already in
      // but if already in, don't add
      .filter((text) => {
        if (words.has(text)) return false;
        words.add(text);
        return true;
      })
      .sort((a, b) => a.localeCompare(b, "tr"));
    moreWords[category] = categoryWords;
  });
  if (words.size === 0) {
    return {
      isUnsuccessful: false,
      words: [
        {
          name,
          meaning,
          words: [],
          moreWords,
          url,
        },
      ],
    };
  }

  return {
    isUnsuccessful: false,
    words: [
      {
        name,
        meaning,
        words: wordsArray,
        moreWords,
        url,
      },
    ],
  };
}

const loadBenzerWord = server$(async function (word: string): Promise<{
  data: BenzerPackage;
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
        data: error.data,
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
    data,
    cookie: newCookie,
  };
});

const cleanseBenzerResponse = (
  e: RequestEventBase,
  response: Awaited<ReturnType<typeof loadBenzerWord>>[],
): BenzerPackage => {
  const sharedMap = loadSharedMap(e);
  const loaded = response;
  const atLeastOneOfThemIsSuccessful = loaded.some(
    (l) => !l?.data.isUnsuccessful,
  );
  if (atLeastOneOfThemIsSuccessful) {
    const words = loaded
      .filter(nonNullable)
      .map((l) => l!.data)
      .filter((l) => !l.isUnsuccessful)
      .map((l) => l.words![0])
      .filter(nonNullable) as BenzerWord[];
    return {
      isUnsuccessful: false,
      words,
    };
  } else {
    const isCaptcha = loaded.some(
      (l) => l?.data.isUnsuccessful && l.data.serverDefinedCaptchaError,
    );
    if (isCaptcha) {
      return {
        isUnsuccessful: true,
        url: buildBenzerUrl(sharedMap.query.cleaned).user,
        serverDefinedCaptchaError: isCaptcha,

        serverDefinedErrorText:
          "Lütfen yukarıdan robot olmadığınızı doğrulayın.",
        words: ["Tekrar", "dene-", sharedMap.query.cleaned],
      };
    } else {
      const w = loaded
        .filter(nonNullable)
        .map((l) => l!.data)
        .filter((l) => l.isUnsuccessful)
        .map((l) => l.words)
        .filter(nonNullable)
        .flat();
      const words = Array.from(new Set(w)) as string[];
      return {
        isUnsuccessful: true,
        url: buildBenzerUrl(sharedMap.query.cleaned).user,
        serverDefinedErrorText: NO_RESULT,
        words,
      };
    }
  }
};

export const benzerLoader = server$(async function (): Promise<BenzerPackage> {
  const e = this;
  // If there is data in cache, return it
  {
    const cache = loadCache(e, "benzer");
    if (cache) return setSharedMapResult(e, "benzer", cache);
  } /////////////////////////////
  const rec = await getBenzerWordForms(e);
  /* if (!rec.words?.length || !rec.isUnsuccessful) return rec; */
  if (rec.isUnsuccessful) {
    return rec;
  }
  const loaded = await Promise.all(
    rec.words.map((word) => loadBenzerWord.call(e, word)),
  );
  // Set the new cookies
  loaded
    .map((word) => word?.cookie)
    .filter((c) => c)
    .forEach((cookie) => {
      cookie?.split("; ").forEach((cookieT) => {
        const [key, value] = cookieT.split("=");
        key && value && e.cookie.set(key, value, { path: "/" });
      });
    });
  const data = cleanseBenzerResponse(e, loaded);
  if (data.isUnsuccessful && data.serverDefinedCaptchaError) return data;
  return setSharedMapResult(e, "benzer", data);
});

// eslint-disable-next-line qwik/loader-location
export const useBenzerLoader = routeLoader$<BenzerPackage>(async (e) => {
  return benzerLoader.call(e);
});
