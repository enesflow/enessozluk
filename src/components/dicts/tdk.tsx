import type { TDKResponse, TDKResponseError } from "#/tdk";
import { component$ } from "@builder.io/qwik";
import { routeLoader$, Link } from "@builder.io/qwik-city";
import { convertToRoman } from "#helpers/roman";
import { Recommendations } from "../recommendations";
import { API_FAILED_TEXT } from "#helpers/constants";

const TDK_LINK_DET = "► " as const;
const TDK_URL = "https://sozluk.gov.tr/gts?ara=" as const;
const TDK_RECOMMENDATIONS_URL = "https://sozluk.gov.tr/oneri?soz=" as const;
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
      console.log(data);
      return data;
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
              </h2>
              <ul class="results-list">
                {result.anlamlarListe?.map((meaning) => (
                  <li
                    key={meaning.anlam_id}
                    class="result-subitem result-description"
                  >
                    {meaning.anlam.startsWith(TDK_LINK_DET) ? (
                      <Link
                        href={`/search/${
                          meaning.anlam
                            .slice(TDK_LINK_DET.length)
                            .split(" (")[0]
                        }`}
                        class="result-description"
                      >
                        {meaning.anlam.slice(TDK_LINK_DET.length)}
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
