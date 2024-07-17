import type { TDKResponse, TDKResponseError } from "#/tdk";
import {
  TDKPackageSchema,
  TDKRecommendationSchema,
  TDKResponseErrorSchema,
  TDKResponseSchema,
  type TDKPackage,
} from "#/tdk";
import { API_FAILED_TEXT, NO_RESULT } from "#helpers/constants";
import { fetchAPI, loadSharedMap, setSharedMapResult } from "#helpers/request";
import type { RequestEventBase } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { buildTDKRecommendationsUrl, buildTDKUrl } from "./url";
import { to } from "../to";
import { debugAPI } from "../log";

const loadTDKRecommendations = async (e: RequestEventBase) => {
  const url = buildTDKRecommendationsUrl(e);
  const response = await fetchAPI(url);
  const data = TDKRecommendationSchema.parse(response);
  return data;
};

function buildTDKAPIError(e: RequestEventBase, title: string) {
  debugAPI(e, title);
  const { query } = loadSharedMap(e);
  return {
    error: `${API_FAILED_TEXT}: ${title}`,
    recommendations: [
      { madde: "Tekrar" },
      { madde: "dene-" },
      { madde: query },
    ],
  };
}

const cleanseTDKResponse = (data: TDKResponse) => {
  // For each lisan "(Arapça)" -> "Arapça"
  for (let i = 0; i < data.length; i++) {
    if (data[i].lisan) {
      data[i].lisan = data[i].lisan?.replace(/^\(/, "").replace(/\)$/, "");
    }
  }
  // Add serverDefinedPreText to every meaning (e.g. isim, mecaz...)
  const firstAttributes = data[0].anlamlarListe?.[0].ozelliklerListe;

  for (const item of data) {
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
  const sharedMap = loadSharedMap(e);
  // If there is data in cache, return it
  {
    const parsed = TDKPackageSchema.safeParse(sharedMap.cache.tdk);
    if (parsed.success) return setSharedMapResult(e, "tdk", parsed.data);
  } /////////////////////////////
  const url = buildTDKUrl(e);
  const [error, response] = await to(fetchAPI(url));
  // Returns error if request failed
  if (error) {
    return buildTDKAPIError(e, error.message);
  }
  const parsed = TDKResponseSchema.safeParse(response);
  // Error handling
  {
    // Returns recommendations if the response is an error or has no results
    const error = TDKResponseErrorSchema.safeParse(parsed.data);
    if (
      error.success ||
      !("anlamlarListe" in (parsed.data as TDKResponse)[0])
    ) {
      const data: TDKResponseError = {
        error: error.data?.error || NO_RESULT,
        recommendations: await loadTDKRecommendations(e),
      };
      return setSharedMapResult(e, "tdk", data);
    }
    // Returns error if parsing failed
    if (!parsed.success) {
      return buildTDKAPIError(e, parsed.error.message);
    }
  } /////////////////////////////
  const data = cleanseTDKResponse(parsed.data);
  return setSharedMapResult(e, "tdk", data);
});
