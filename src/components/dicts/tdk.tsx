import type { TDKResponse, TDKResponseError } from "#/tdk";
import { component$ } from "@builder.io/qwik";
import { routeLoader$, Link } from "@builder.io/qwik-city";
import { convertToRoman } from "#helpers/roman";
import { Recommendations } from "../recommendations";
import { API_FAILED_TEXT } from "#helpers/constants";

const TDK_LINK_DET = "► " as const;
const TDK_URL = "https://sozluk.gov.tr/gts?ara=" as const;
const TDK_RECOMMENDATIONS_URL = "https://sozluk.gov.tr/oneri?soz=" as const;

export function isOutLink(word: string): {
  outLink: boolean;
  cleanWord: string;
} {
  if (word.startsWith(TDK_LINK_DET)) {
    return {
      outLink: true,
      cleanWord: word.slice(TDK_LINK_DET.length),
    };
  }
  // for some words (like "server") the result starts with a number (like "343 sunucu")
  // i don't know if the number is always 343, but let's check for all numbers
  // let's see if it starts with a number then a space:
  const match = word.match(/^\d+ /);
  if (match) {
    return {
      outLink: true,
      cleanWord: word.slice(match[0].length),
    };
  }
  return {
    outLink: false,
    cleanWord: word,
  };
}

export function preprocessTDK(data: TDKResponse | TDKResponseError) {
  if ("error" in data) {
    return data;
  }
  // 1. remove the paranthesises from the beginning and the end of lisan if they exist
  // and only from the beginning ( and the end ) of lisan
  for (let i = 0; i < data.length; i++) {
    if (data[i].lisan) {
      data[i].lisan = data[i].lisan.replace(/^\(/, "").replace(/\)$/, "");
    }
  }
  return data;
}
// eslint-disable-next-line qwik/loader-location
export const useTDKLoader = routeLoader$<TDKResponse | TDKResponseError>(
  async ({ params }) => {
    const url = `${TDK_URL}${params.query}`;
    const response = await fetch(url);
    try {
      const data = (await response.json()) as TDKResponse | TDKResponseError;
      if ("error" in data || !("anlamlarListe" in data[0])) {
        // then we need to get the recommendations
        const recUrl = `${TDK_RECOMMENDATIONS_URL}${params.query}`;
        const recResponse = await fetch(recUrl);
        const recData = await recResponse.json();
        (data as TDKResponseError).recommendations = recData;
      }
      return preprocessTDK(data);
    } catch (error) {
      return {
        error: API_FAILED_TEXT,
        recommendations: [
          { madde: "Tekrar" },
          { madde: "dene-" },
          { madde: params.query },
        ],
      };
    }
  },
);

export const TDKView = component$<{
  data: TDKResponse | TDKResponseError;
}>(({ data }) => {
  return (
    <>
      {"error" in data ? (
        <>
          <p class="error-message">{data.error}</p>
          {data.recommendations.length > 0 && (
            <>
              <div class="result-item result-subitem">
                Öneriler:{" "}
                <Recommendations
                  words={data.recommendations.map((rec) => rec.madde)}
                />
              </div>
            </>
          )}
        </>
      ) : (
        <ul class="results-list">
          {data.map((result, index) => (
            <li key={result.madde_id} class="result-item">
              <h2 class="result-title">
                ({convertToRoman(index + 1)}) {result.madde}{" "}
                {result.taki ? `-${result.taki}` : ""}
                {result.lisan && <> ({result.lisan})</>}
              </h2>
              <ul class="results-list">
                {result.anlamlarListe?.map((meaning) => (
                  <li
                    key={meaning.anlam_id}
                    class="result-subitem result-description"
                  >
                    {isOutLink(meaning.anlam).outLink ? (
                      <Link
                        href={`/search/${
                          isOutLink(meaning.anlam).cleanWord.split(" (")[0]
                        }`}
                        class="result-description"
                      >
                        {isOutLink(meaning.anlam).cleanWord}
                      </Link>
                    ) : (
                      meaning.anlam
                    )}
                    <ul>
                      {meaning.orneklerListe?.map((example) => (
                        <li key={example.ornek_id} class="result-quote">
                          <p>
                            "{example.ornek}"{" "}
                            <em>
                              {example.yazar
                                ?.map((yazar) => yazar.tam_adi)
                                .join(", ")}
                            </em>
                          </p>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </>
  );
});
