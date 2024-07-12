import type { BenzerResponse, BenzerResponseError } from "#/benzer";
import { API_FAILED_TEXT, NO_RESULT } from "#helpers/constants";
import type { QRL } from "@builder.io/qwik";
import {
  $,
  component$,
  useComputed$,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import { Link, routeLoader$ } from "@builder.io/qwik-city";
import { load } from "cheerio";
import { Recommendations } from "~/components/recommendations";
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
    const entryContentMain = $(".entry-content-main ul li a");

    if (entryContentMain.length === 0) {
      const words: string[] = [];
      const captchaButton = $(
        "body > main > div.page > div > div.page-main > div > div.page-content > div > form > div > span:nth-child(2) > span > button",
      );
      if (captchaButton.length > 0) {
        return {
          isUnsuccessful: true,
          serverDefinedCaptchaError: true,
          serverDefinedErrorText:
            "Lütfen yukarıdan robot olmadığınızı doğrulayın.",
          words: ["Tekrar", "dene-", params.query],
        };
      }
      const suggestionBox = $(".suggestion-box > ul:nth-child(2) li a");
      if (suggestionBox.length === 0) {
        return {
          isUnsuccessful: true,
        };
      }
      suggestionBox.each((_, element) => {
        words.push($(element).text());
      });

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

export const IFrame = component$<{ src: string; callback?: QRL<any> }>(
  ({ src, callback }) => {
    const LOCAL_STORAGE_ITEM = "show-captcha" as const;
    const loaded = useSignal(0);

    const show = useSignal(false);

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(() => {
      // read local storage LOCAL_STORAGE_ITEM
      const showCaptcha = localStorage.getItem(LOCAL_STORAGE_ITEM);
      if (showCaptcha) {
        show.value = true;
      }
    });

    return (
      <>
        {show.value ? (
          <>
            <div class="relative overflow-hidden rounded-lg">
              <iframe
                title="Benzer Kelimeler"
                class="h-[30rem] w-full"
                src={src}
                onLoad$={async () => {
                  loaded.value++;
                  console.log("loaded", loaded.value);
                  if (loaded.value >= 2) {
                    console.log("reloading");
                    localStorage.removeItem(LOCAL_STORAGE_ITEM);
                    await callback?.();
                    show.value = false;
                  }
                }}
              ></iframe>
              {loaded.value === 0 && (
                <div class="absolute inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
                  <p class="text-2xl text-white">
                    benzerkelimeler.com yükleniyor...
                  </p>
                </div>
              )}
            </div>
            <div>
              <Link
                onClick$={() => {
                  localStorage.removeItem(LOCAL_STORAGE_ITEM);
                  show.value = false;
                }}
                class="cursor-pointer"
              >
                Güvenlik doğrulamasını kapat
              </Link>
            </div>
          </>
        ) : (
          <Link
            onClick$={() => {
              localStorage.setItem(LOCAL_STORAGE_ITEM, "true");
              loaded.value = 0;
              setTimeout(() => {
                show.value = true;
              }, 100);
            }}
            class="cursor-pointer"
          >
            Güvenlik doğrulamasını göster
          </Link>
        )}
      </>
    );
  },
);

export const BenzerView = component$<{
  data: BenzerResponse | BenzerResponseError;
}>(({ data }) => {
  const showCaptcha = useComputed$(
    () => (data.isUnsuccessful && data.serverDefinedCaptchaError) || false,
  );
  return (
    <>
      {data.isUnsuccessful ? (
        <>
          {showCaptcha.value && (
            <IFrame
              // remove "kelime/" from the URL
              src={`${BENZER_URL.split("/").slice(0, -1).join("/")}/dogrulama`}
              callback={$(async () => {
                data.serverDefinedCaptchaError = false;
                window.location.reload();
              })}
            />
          )}
          <p class="error-message">
            {data.serverDefinedErrorText ?? NO_RESULT}
          </p>
          {(data.words ?? []).length > 0 && (
            <>
              <div class="result-item result-subitem">
                Öneriler: <Recommendations words={data.words!} />
              </div>
            </>
          )}
        </>
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
