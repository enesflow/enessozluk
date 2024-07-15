import type { TDKPackage, TDKResponseError } from "#/tdk";
import { fetchAPI } from "#helpers/cache";
import { API_FAILED_TEXT } from "#helpers/constants";
import { convertToRoman } from "#helpers/roman";
import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { LinkR } from "../linkWithRedirect";
import { Recommendations } from "../recommendations";
import { WordLinks } from "../WordLinks";

const TDK_LINK_DET = "► " as const;
const TDK_URL = "https://sozluk.gov.tr/gts?ara=" as const;
const TDK_RECOMMENDATIONS_URL = "https://sozluk.gov.tr/oneri?soz=" as const;

export function isOutLink(word: string): {
  outLink: boolean;
  cleanWord: string;
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
      cleanWord: romanToFront(word.slice(TDK_LINK_DET.length)),
    };
  }
  // To make sense of this check, check queries "server" and "z kuşağı" on TDK
  if (word.startsWith("343 ")) {
    return {
      outLink: true,
      cleanWord: romanToFront(word.slice(4)),
    };
  }

  return {
    outLink: false,
    cleanWord: romanToFront(word),
  };
}

export function preprocessTDK(data: TDKPackage) {
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
  // 2. add serverDefinedPreText to every meaning
  const firstAttributes = data[0].anlamlarListe?.[0].ozelliklerListe;
  for (let i = 0; i < data.length; i++) {
    if (data[i].anlamlarListe) {
      for (let j = 0; j < (data[i].anlamlarListe ?? []).length; j++) {
        const meaning = data[i].anlamlarListe![j];
        // if there is not a attribute with the same type as the first attribute
        // then add firstAttributes to the start of meaning.ozelliklerListe
        if (
          !meaning.ozelliklerListe?.some(
            (ozellik) => ozellik.tur === firstAttributes?.[0].tur,
          )
        ) {
          meaning.ozelliklerListe = firstAttributes?.concat(
            meaning.ozelliklerListe ?? [],
          );
        }
        data[i].anlamlarListe![j].serverDefinedPreText = meaning.ozelliklerListe
          ?.map((ozellik) => ozellik.tam_adi)
          .filter((value, index, self) => self.indexOf(value) === index) // remove duplicates
          .join(", ");
      }
    }
  }
  return data;
}

function isTDKResponseError(
  data: TDKPackage | TDKResponseError,
): data is TDKResponseError {
  return "error" in data || !("anlamlarListe" in data[0]);
}

// eslint-disable-next-line qwik/loader-location
export const useTDKLoader = routeLoader$<TDKPackage>(async ({ params }) => {
  const url = `${TDK_URL}${params.query}`;
  try {
    const { data } = await fetchAPI(url, {
      provider: "tdk",
    });
    if (!isTDKResponseError(data)) {
      return preprocessTDK(data);
    } else {
      const url = `${TDK_RECOMMENDATIONS_URL}${params.query}`;
      const { data: recommendations } = await fetchAPI(url, {
        provider: "general-tdk-recommendations",
      });
      return {
        error: "error" in data ? data.error : API_FAILED_TEXT,
        recommendations: recommendations as any,
      };
    }
  } catch (error) {
    console.error("TDK FAILED", error);
    return {
      error: API_FAILED_TEXT,
      recommendations: [
        { madde: "Tekrar" },
        { madde: "dene-" },
        { madde: params.query },
      ],
    };
  }
});

export const TDKView = component$<{
  data: TDKPackage;
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
        <>
          {" "}
          <ul class="results-list">
            {data.map((result, index) => (
              <li key={result.madde_id} class="result-item">
                <h2 class="result-title">
                  ({convertToRoman(index + 1)}) {result.madde}{" "}
                  {result.taki ? `-${result.taki}` : ""}
                  <i class="result-title-description">
                    {result.telaffuz && <> {result.telaffuz}</>}
                    {result.lisan && <> ({result.lisan})</>}
                  </i>
                </h2>
                <ul class="results-list">
                  {result.anlamlarListe?.map((meaning) => (
                    <li
                      key={meaning.anlam_id}
                      class="result-subitem result-description"
                    >
                      <strong>{meaning.serverDefinedPreText} </strong>
                      {isOutLink(meaning.anlam).outLink ? (
                        <LinkR
                          href={`/search/${isOutLink(meaning.anlam)
                            .cleanWord.split(" ")
                            .filter((word) => !word.startsWith("("))
                            .join(" ")}`}
                          class="result-description"
                        >
                          {isOutLink(meaning.anlam).cleanWord}
                        </LinkR>
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
          {data
            .map((result) =>
              result.birlesikler?.split(", ").map((word) => word.trim()),
            )
            .flat()
            .filter(Boolean).length > 0 && (
            <section class="result-section">
              <h2 class="result-subtitle">Birleşik sözcükler</h2>
              <WordLinks
                words={
                  data
                    .map((result) =>
                      result.birlesikler
                        ?.split(", ")
                        .map((word) => word.trim()),
                    )
                    .flat()
                    .filter(Boolean) as string[]
                }
              />
            </section>
          )}
        </>
      )}
    </>
  );
});
