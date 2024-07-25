import type { BenzerPackage, BenzerResponseError } from "#/benzer";
import { NO_RESULT } from "#helpers/constants";
import type { QRL } from "@builder.io/qwik";
import { $, component$, useComputed$, useSignal } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { ExternalLink } from "~/components/externalLink";
import { benzerLoader } from "~/helpers/dicts/benzer";
import { BENZER_URL } from "~/helpers/dicts/url";
import { convertToRoman } from "~/helpers/roman";
import { WordLinks } from "../WordLinks";

export const IFrame = component$<{ src: string; callback?: QRL<any> }>(
  ({ src, callback }) => {
    const LOCAL_STORAGE_ITEM = "show-captcha" as const;
    const loaded = useSignal(0);
    const showForceReload = useSignal(false);
    const show = useSignal(false);

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
                  if (loaded.value === 1) {
                    showForceReload.value = true;
                  }
                  if (loaded.value === 2) {
                    show.value = false;
                    await callback?.();
                  }
                }}
              ></iframe>
              {loaded.value === 0 && (
                <div class="absolute inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50 text-center">
                  <p class="text-2xl text-white">
                    benzerkelimeler.com yükleniyor...
                  </p>
                </div>
              )}
            </div>
            <div class="">
              <Link
                preventdefault:click
                onClick$={() => {
                  show.value = false;
                  showForceReload.value = false;
                }}
                class="cursor-pointer"
              >
                Güvenlik doğrulamasını kapat
              </Link>
              {showForceReload.value && (
                <>
                  ,{" "}
                  <Link
                    preventdefault:click
                    onClick$={async () => {
                      show.value = false;
                      await callback?.();
                    }}
                    class="cursor-pointer"
                  >
                    Yeniden yükle
                  </Link>
                </>
              )}
            </div>
          </>
        ) : (
          <Link
            preventdefault:click
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

function makeBold(text: string) {
  text = text.replaceAll("] [", ", ");
  text = text.replaceAll("[", "<strong>").replaceAll("]", "</strong>");
  return text;
}

export const BenzerView = component$<{
  data: BenzerPackage;
}>(({ data: _data }) => {
  const data = useComputed$(() => _data);
  const showCaptcha = useComputed$(
    () =>
      (data.value.isUnsuccessful && data.value.serverDefinedCaptchaError) ||
      false,
  );
  return (
    <>
      {data.value.isUnsuccessful ? (
        <>
          {showCaptcha.value && (
            <IFrame
              // remove "kelime/" from the URL
              src={`${BENZER_URL.split("/").slice(0, -1).join("/")}/dogrulama`}
              callback={$(async () => {
                showCaptcha.value = false;
                (data.value as BenzerResponseError).serverDefinedErrorText =
                  "Yükleniyor...";
                (data.value as BenzerResponseError).words = [];
                data.value = await benzerLoader();
              })}
            />
          )}
          <p class="error-message">
            {data.value.serverDefinedErrorText ?? NO_RESULT}
          </p>
          {!!data.value.words?.length && (
            <>
              <div class="result-item result-subitem">
                Öneriler: <WordLinks words={data.value.words!} />
              </div>
            </>
          )}
        </>
      ) : (
        <ul class="results-list">
          {data.value.words.map((word, index) => (
            <li class="result-item" key={word.url}>
              <h2 class="result-title">
                <span class="mr-1">
                  ({convertToRoman(index + 1)}) {word.name}
                </span>
                {data.value.words!.length > 1 && (
                  <ExternalLink href={word.url} />
                )}
              </h2>
              {
                <ul class="results-list">
                  <li
                    class="result-subitem"
                    dangerouslySetInnerHTML={makeBold(word.meaning)}
                  ></li>
                </ul>
              }
              {word.words.length ? (
                <WordLinks
                  words={word.words}
                  more={Object.keys(word.moreWords).flatMap(
                    (category) => word.moreWords[category],
                  )}
                />
              ) : (
                <p class="result-description">
                  <i>{NO_RESULT}</i>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
});
