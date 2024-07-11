import type { TDKResponse, TDKResponseError } from "#/tdk";
import { component$ } from "@builder.io/qwik";
import { routeLoader$, Link } from "@builder.io/qwik-city";
import { convertToRoman } from "#helpers/roman";
import { Recommendations } from "../recommendations";
import { API_FAILED_TEXT } from "#helpers/constants";
import { WordLinks } from "./nisanyan";

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
  // To make sense of this check, check queries "server" and "z kuşağı" on TDK
  if (word.startsWith("343 ")) {
    return {
      outLink: true,
      cleanWord: word.slice(4),
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
          .join(", ");
      }
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
