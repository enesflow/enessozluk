import { component$, useSignal } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { KUBBEALTI_TTS_URL } from "~/helpers/dicts/url";
import type { KubbealtiPackage } from "~/types/kubbealti";
import Speaker from "../speaker";

// const TDK_LINK_DET = "► " as const;

/* export function isOutLink(word: string): {
  outLink: boolean;
  cleanWords: string[];
} {
  function romanToFront(word: string): string {
    // example:
    // input: heykel (I)
    // output: (I) heykel
    const words = word.split(" ");
    if (words.length < 2) {
      return word;
    }
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith("(") && lastWord.endsWith(")")) {
      return `${lastWord} ${words.slice(0, -1).join(" ")}`;
    }
    return word;
  }
  if (word.startsWith(TDK_LINK_DET)) {
    return {
      outLink: true,
      cleanWords: word.slice(TDK_LINK_DET.length).split(", ").map(romanToFront),
    };
  }
  // To make sense of this check, check queries "server" and "z kuşağı" on TDK
  if (word.startsWith("343 ")) {
    return {
      outLink: true,
      cleanWords: word.slice(4).split(", ").map(romanToFront),
    };
  }

  return {
    outLink: false,
    cleanWords: [],
  };
} */

const Play = component$<{ id: string | null | undefined }>(({ id }) => {
  const audio = useSignal<HTMLAudioElement>();
  return id ? (
    <button
      onClick$={() => {
        audio.value?.play();
      }}
    >
      <audio src={KUBBEALTI_TTS_URL + id + ".wav"} ref={audio}></audio>
      <Speaker />
    </button>
  ) : (
    <></>
  );
});

export const KubbealtiView = component$<{
  data: KubbealtiPackage;
}>(({ data }) => {
  const loc = useLocation();
  const currentPage =
    "items" in data ? data.items.find((item) => item.current)?.number : -1;
  return (
    <>
      {"serverDefinedReason" in data ? (
        <>
          <p class="error-message">{data.serverDefinedReason}</p>
          {/* {data.recommendations.length > 0 && (
            <>
              <div class="result-item result-subitem">
                Öneriler:{" "}
                <WordLinks
                  words={data.recommendations
                    .map((rec) => rec.madde)
                    .filter(
                      (value, index, self) => self.indexOf(value) === index,
                    )}
                />
              </div>
            </>
          )} */}
        </>
      ) : (
        <>
          <p class="result-title-took">{data.totalElements} sonuç bulundu.</p>{" "}
          <ul class="results-list">
            {data.content.map((result /* index */) => (
              <li key={result.id} class="result-item">
                <h2 class="result-title">
                  {result.kelime} <Play id={result.id.toString()} />
                </h2>
                <ul class="results-list">
                  <div dangerouslySetInnerHTML={result.anlam} />
                </ul>
              </li>
            ))}
          </ul>
          {/* a page selector */}
          {data.totalPages > 1 && (
            <select
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              onChange$={async (_, e) => {
                const url = loc.url;
                // set kubbealtiPage to e.value
                url.searchParams.set("kubbealtiPage", e.value);
                window.location.href = url.toString();
              }}
              class="mb-4"
            >
              {Array.from({ length: data.totalPages }, (_, i) => (
                <option key={i} value={i + 1} selected={i + 1 === currentPage}>
                  {"Kubbealtı Sayfa " + (i + 1).toString()}
                </option>
              ))}
            </select>
          )}
        </>
      )}
    </>
  );
});
