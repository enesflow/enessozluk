import type { Signal } from "@builder.io/qwik";
import { component$, useSignal } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { getKubbealtiPage, kubbealtiLoader } from "~/helpers/dicts/kubbealti";
import { KUBBEALTI_TTS_URL } from "~/helpers/dicts/url";
import { convertToRoman } from "~/helpers/roman";
import type { KubbealtiPackage } from "~/types/kubbealti";
import { Play } from "../play";

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

export const KubbealtiView = component$<{
  data: Signal<KubbealtiPackage>;
}>(({ data }) => {
  const loc = useLocation();
  const kubbealtiPage = useSignal(getKubbealtiPage(loc.url));
  return (
    <>
      {"serverDefinedReason" in data.value ? (
        <>
          <p class="error-message">{data.value.serverDefinedReason}</p>
          {/* {data.value.recommendations.length > 0 && (
            <>
              <div class="result-item result-subitem">
                Öneriler:{" "}
                <WordLinks
                  words={data.value.recommendations
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
          <p class="result-title-took">
            {data.value.totalElements} sonuç bulundu.
          </p>{" "}
          <ul class="results-list">
            {data.value.content[kubbealtiPage.value]?.map((result, index) => (
              <li key={result.id} class="result-item">
                <h2 class="result-title">
                  {data.value.content[kubbealtiPage.value]?.length === 1
                    ? "•"
                    : `(${convertToRoman(index + 1)})`}{" "}
                  {result.kelime}{" "}
                  <Play id={result.id.toString()} base={KUBBEALTI_TTS_URL} />
                </h2>
                <ul class="results-list">
                  <div dangerouslySetInnerHTML={result.anlam} />
                </ul>
              </li>
            ))}
          </ul>
          {/* a page selector */}
          {data.value.totalPages > 1 && (
            <select
              onChange$={async (_, e) => {
                const value = Number.parseInt(e.value) || 1;
                const url = loc.url;
                url.searchParams.set("kubbealtiPage", value.toString());
                window.history.replaceState(null, "", url.toString());
                if (!(value in data.value.content))
                  data.value = await kubbealtiLoader(value);
                kubbealtiPage.value = value;
              }}
              class="mb-4"
            >
              {Array.from({ length: data.value.totalPages }, (_, i) => (
                <option
                  key={i}
                  value={i + 1}
                  selected={i + 1 === kubbealtiPage.value}
                >
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
