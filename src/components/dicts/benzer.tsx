import type { BenzerResponse, BenzerResponseError } from "#/benzer";
import { API_FAILED_TEXT, NO_RESULT } from "#helpers/constants";
import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { load } from "cheerio";
import { WordLinks } from "../WordLinks";
const BENZER_URL = "https://www.benzerkelimeler.com/kelime/" as const;

const mostPopularUserAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.37",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.38",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.39",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.40",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.41",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.42",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.43",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.44",
];

// eslint-disable-next-line qwik/loader-location
export const useBenzerLoader = routeLoader$<
  BenzerResponse | BenzerResponseError
>(async ({ params, request, clientConn, cookie }) => {
  try {
    const url = `${BENZER_URL}${params.query}`;
    /* const response = await fetch(url); */
    // this website has a captcha, so we need to send the
    // request as if it is coming from the user's browser

    // headers.get

    // cookie to header text
    let cookieText = "";
    for (const [key, value] of Object.entries(cookie)) {
      cookieText += `${key}=${value}; `;
    }

    const response = await fetch(url, {
      ...request,
      headers: {
        // disguise as a browser
        ...request.headers,
        "user-agent":
          mostPopularUserAgents[
            Math.floor(Math.random() * mostPopularUserAgents.length)
          ],
        // some more fake headers
        "accept-language": "en-US,en;q=0.9",
        "accept-encoding": "gzip, deflate, br",
        "upgrade-insecure-requests": "1",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "sec-fetch-user": "?1",
        "sec-fetch-dest": "document",
        "cache-control": "max-age=0",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "x-real-ip": clientConn.ip,
        cookie: cookieText,
      },
    });

    const html = await response.text();
    // (method) Cookie.set(name: string, value: string | number | Record<string, any>, options?: CookieOptions): void
    // set all cookies as if they are coming from the browser
    const cookieHeaders = response.headers.get("set-cookie");
    if (cookieHeaders) {
      const cookies = cookieHeaders.split("; ");
      for (const cookieT of cookies) {
        const [key, value] = cookieT.split("=");
        if (key && value) {
          // set the cookie
          cookie.set(key, value, { path: "/" });
        }
      }
    }

    const $ = load(html);

    // Extract words from the first list
    const words = new Set<string>();
    const entryContentMainExists = $(".entry-content-main").length > 0;

    if (!entryContentMainExists) {
      throw new Error("entry-content-main not found. Probably a captcha.");
    }

    $(".entry-content-main ul li a").each((_, element) => {
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
          if (!words.has(text)) {
            categoryWords.add(text);
          }
        });
      moreWords[category] = Array.from(categoryWords);
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
  } catch (error) {
    console.log(error);
    return {
      isUnsuccessful: true,
      serverDefinedErrorText: API_FAILED_TEXT,
    };
  }
});

export const BenzerView = component$<{
  data: BenzerResponse | BenzerResponseError;
}>(({ data }) => {
  return (
    <>
      {data.isUnsuccessful ? (
        <p class="error-message">{data.serverDefinedErrorText ?? NO_RESULT}</p>
      ) : (
        <section class="result-section">
          <WordLinks
            words={data.words}
            more={Object.keys(data.moreWords).flatMap(
              (category) => data.moreWords[category],
            )}
          />
        </section>
      )}
    </>
  );
});
