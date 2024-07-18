import type {
  BenzerPackage,
  BenzerResponse,
  BenzerResponseError,
} from "#/benzer";
import { NO_RESULT } from "#helpers/constants";
import type { QRL } from "@builder.io/qwik";
import {
  $,
  component$,
  useComputed$,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { Recommendations } from "~/components/recommendations";
import { WordLinks } from "../WordLinks";
import { BENZER_URL } from "~/helpers/dicts/url";
import { benzerLoader } from "~/helpers/dicts/benzer";

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
                  if (loaded.value === 2) {
                    console.log("reloading");
                    localStorage.removeItem(LOCAL_STORAGE_ITEM);
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
            <div>
              <Link
                preventdefault:click
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
                Öneriler: <Recommendations words={data.value.words!} />
              </div>
            </>
          )}
        </>
      ) : (
        <section class="result-section">
          <WordLinks
            words={data.value.words}
            more={Object.keys(data.value.moreWords).flatMap(
              (category) => (data.value as BenzerResponse).moreWords[category],
            )}
          />
        </section>
      )}
    </>
  );
});
