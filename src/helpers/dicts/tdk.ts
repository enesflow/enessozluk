import type { TDKResponse, TDKResponseError } from "#/tdk";
import {
  TDKRecommendationSchema,
  TDKResponseErrorSchema,
  TDKResponseSchema,
  type TDKPackage,
} from "#/tdk";
import { API_FAILED_TEXT, NO_RESULT } from "#helpers/constants";
import {
  fetchAPI,
  loadCache,
  loadSharedMap,
  setSharedMapResult,
} from "#helpers/request";
import type { RequestEventBase } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { debugAPI } from "../log";
import { to } from "../to";
import { buildTDKRecommendationsUrl, buildTDKUrl } from "./url";

const loadTDKRecommendations = async (e: RequestEventBase) => {
  const url = buildTDKRecommendationsUrl(e);
  const [error, response] = await to(fetchAPI(url));
  if (error || !response?.success) {
    debugAPI(e, `TDK API Error: ${error?.message || response?.code}`);
    return [
      { madde: "Tekrar" },
      { madde: "dene-" },
      { madde: loadSharedMap(e).query as string },
    ];
  }
  const data = TDKRecommendationSchema.parse(response.data);
  return data;
};

function buildTDKAPIError(
  e: RequestEventBase,
  title: string,
): TDKResponseError {
  debugAPI(e, `TDK API Error: ${title}`);
  const { query } = loadSharedMap(e);
  return {
    error: title,
    recommendations: [
      { madde: "Tekrar" },
      { madde: "dene-" },
      { madde: query },
    ],
  };
}

const cleanseTDKResponse = (data: TDKResponse) => {
  // For each lisan "(Arapça)" -> "Arapça"
  for (let i = 0; i < data.meanings.length; i++) {
    if (data.meanings[i].lisan) {
      data.meanings[i].lisan = data.meanings[i].lisan
        ?.replace(/^\(/, "")
        .replace(/\)$/, "");
    }
  }
  // Add serverDefinedPreText to every meaning (e.g. isim, mecaz...)
  const firstAttributes = data.meanings[0].anlamlarListe?.[0].ozelliklerListe;

  for (const item of data.meanings) {
    if (!item.anlamlarListe) continue;

    for (const meaning of item.anlamlarListe) {
      // If there is not an attribute with the same type as the first attribute
      // then add firstAttributes to the start of meaning.ozelliklerListe
      if (
        !meaning.ozelliklerListe?.some(
          (ozellik) => ozellik.tur === firstAttributes?.[0].tur,
        )
      ) {
        meaning.ozelliklerListe = [
          ...(firstAttributes ?? []),
          ...(meaning.ozelliklerListe ?? []),
        ];
      }

      meaning.serverDefinedPreText = (meaning.ozelliklerListe ?? [])
        .map((ozellik) => ozellik.tam_adi)
        .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
        .join(", ");
    }
  }

  return data;
};

// eslint-disable-next-line qwik/loader-location
export const useTDKLoader = routeLoader$<TDKPackage>(async (e) => {
  // If there is data in cache, return it
  {
    const cache = loadCache(e, "tdk");
    if (cache) return setSharedMapResult(e, "tdk", cache);
  } /////////////////////////////
  const url = buildTDKUrl(e);
  const [error, response] = await to(fetchAPI(url));
  // Returns error if request failed
  if (error || !response?.success) {
    debugAPI(e, `TDK API Error: ${error?.message || response?.code}`);
    return buildTDKAPIError(
      e,
      `${API_FAILED_TEXT}: ${error?.message || response?.code}`,
    );
  }
  const parsed = TDKResponseSchema.safeParse(response.data);
  // Error handling
  {
    // Returns recommendations if the response is an error or has no results
    const error = TDKResponseErrorSchema.safeParse(response.data);
    const first = (parsed.data as TDKResponse | undefined)?.meanings[0];
    if (error.success || !first || !("anlamlarListe" in first)) {
      const data: TDKResponseError = {
        error: error.data?.error || NO_RESULT,
        recommendations: await loadTDKRecommendations(e),
      };
      return setSharedMapResult(e, "tdk", data);
    }
    // Returns error if parsing failed
    if (!parsed.success) {
      return buildTDKAPIError(e, `${API_FAILED_TEXT}: ${parsed.error.message}`);
    }
  } /////////////////////////////
  const data = cleanseTDKResponse(parsed.data);
  return setSharedMapResult(e, "tdk", data);
});
