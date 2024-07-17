import type { BenzerPackage } from "#/benzer";
import { NO_RESULT } from "#helpers/constants";
import type { CheerioAPI } from "cheerio";
import { load } from "cheerio";
import { getFakeHeaders } from "~/components/dicts/benzer";
import { fetchAPI } from "./cache";

export function isBenzerCaptcha(data: string | CheerioAPI): boolean {
  const $ = typeof data === "string" ? load(data) : data;
  const captchaButton = $(
    "body > main > div.page > div > div.page-main > div > div.page-content > div > form > div > span:nth-child(2) > span > button",
  );
  return captchaButton.length > 0;
}

////////

export async function parseBenzer(
  data: string,
  url: string,
): Promise<BenzerPackage> {
  const query = decodeURIComponent(
    new URL(url).pathname.split("/").pop() ?? "",
  );
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const $ = load(data);

  // Extract words from the first list
  const words = new Set<string>();
  const entryContentMain = $(".entry-content-main ul li a");

  if (entryContentMain.length === 0) {
    const words: string[] = [];
    if (isBenzerCaptcha($)) {
      return {
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
        isUnsuccessful: true,
      };
    }
    for (const element of suggestionBox) {
      const word = $(element).text();
      words.push(word);
      /* if (word.toLocaleLowerCase("tr") === query) {
        return {
          isUnsuccessful: true,
          serverDefinedErrorText: DID_YOU_MEAN,
          words: [word],
        };
      } */
      if (
        query.toLocaleLowerCase("tr") === word.toLocaleLowerCase("tr") &&
        word !== query
      ) {
        console.log("from", query, "to", word);
        const originalURL = new URL(url);
        const decodedURL = decodeURIComponent(originalURL.href.split("?")[0]);
        const suffix = decodedURL.endsWith("/") ? "/" : "";
        const baseURL = decodedURL.slice(0, -query.length - suffix.length);
        const newURL = `${baseURL}${word}${suffix}`;

        const { data } = await fetchAPI(newURL, {
          provider: "benzer",
          headers: getFakeHeaders(),
        });

        return data;
      }
    }

    return {
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
    const categoryWords = new Set<string>();
    $(element)
      .find(".entry-content-sub-content ul li a")
      .each((_, elem) => {
        const text = $(elem).text();
        if (!words.has(text) && text !== query) {
          categoryWords.add(text);
        }
      });
    // moreWords[category] = Array.from(categoryWords).sort();
    // sort with support for turkish characters (ç, ı, ğ, ö, ş, ü)
    moreWords[category] = Array.from(categoryWords).sort((a, b) =>
      a.localeCompare(b, "tr"),
    );
  });

  if (words.size === 0) {
    return {
      isUnsuccessful: true,
      serverDefinedErrorText: NO_RESULT,
    };
  }

  return {
    isUnsuccessful: false,
    words: Array.from(words),
    moreWords,
  };
}
