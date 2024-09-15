import type { TDKResponse, TDKResponseError } from "#/tdk";
import {
  TDK_VERSION,
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
  withoutCache,
} from "#helpers/request";
import type { RequestEventBase } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { DEV_DISABLED } from "~/routes/search/[query]/dev";
import { debugAPI } from "../log";
import { perf } from "../time";
import { to } from "../to";
import { buildTDKRecommendationsUrl, buildTDKUrl } from "./url";

const loadTDKRecommendations = async (e: RequestEventBase) => {
  const url = buildTDKRecommendationsUrl(e);
  const [error, response] = await to(fetchAPI(url.api));
  if (error || !response?.success) {
    return buildTDKAPIError(
      e,
      url.user,
      `${API_FAILED_TEXT}: ${error?.message || response?.code}`,
    ).recommendations;
  }
  const data = TDKRecommendationSchema.parse(response.data);
  return data;
};

function buildTDKAPIError(
  e: RequestEventBase,
  url: string,
  title: string,
): TDKResponseError {
  debugAPI(e, `TDK API Error: ${title}`);
  return withoutCache(e, {
    url,
    error: title,
    recommendations: [],
    version: TDK_VERSION,
    perf: perf(e),
  });
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

const loadTTSId = async (data: TDKResponse | string) => {
  // https://sozluk.gov.tr/yazim?ara={word}
  // response : [{"yazim_id":"30886","sozu":"herkes","ekler":"","seskod":"h1574"}]
  // we need to return the "seskod"
  // if there is an error: {"error":"Sonuç bulunamadı"} is the response of the fetch
  const url = `https://sozluk.gov.tr/yazim?ara=${typeof data === "string" ? data : data.meanings[0].madde}`;
  const [error, response] = await to(fetchAPI(url));
  if (error || !response?.success) return undefined;
  return ((response.data as any)[0] as { seskod: string } | undefined)?.seskod;
};

// eslint-disable-next-line qwik/loader-location
export const useTDKLoader = routeLoader$<TDKPackage>(async (e) => {
  if (DEV_DISABLED.tdk) return buildTDKAPIError(e, "", "TDK is disabled");
  // If there is data in cache, return it
  {
    const cache = loadCache(e, "tdk");
    if (cache) return setSharedMapResult(e, "tdk", cache);
  } /////////////////////////////
  const sharedMap = loadSharedMap(e);
  const url = buildTDKUrl(e);
  /* const [error, response] = await to(fetchAPI(url.api)); */
  const [[error, response], ttsId, recommendations] = await Promise.all([
    to(fetchAPI(url.api)),
    loadTTSId(sharedMap.query.noNumEtcL),
    loadTDKRecommendations(e),
  ]);
  // Returns error if request failed
  if (error || !response?.success) {
    debugAPI(e, `TDK API Error: ${error?.message || response?.code}`);
    return buildTDKAPIError(
      e,
      url.user,
      `${API_FAILED_TEXT}: ${error?.message || response?.code}`,
    );
  }
  response.data = {
    meanings: response.data as any,
    url: url.user,
    version: TDK_VERSION,
    perf: perf(e),
  } satisfies TDKResponse;
  const parsed = TDKResponseSchema.safeParse(response.data);
  // Error handling
  {
    // Returns recommendations if the response is an error or has no results
    const error = TDKResponseErrorSchema.safeParse(response.data);
    const first = (parsed.data as TDKResponse | undefined)?.meanings[0];
    if (error.success || !first || !("anlamlarListe" in first)) {
      const data: TDKResponseError = {
        error: error.data?.error || NO_RESULT,
        recommendations,
        url: url.user,
        version: TDK_VERSION,
        perf: perf(e),
      };
      return setSharedMapResult(e, "tdk", data);
    }
    // Returns error if parsing failed
    if (!parsed.success) {
      return buildTDKAPIError(
        e,
        url.user,
        `${API_FAILED_TEXT}: ${parsed.error.message}`,
      );
    }
  } /////////////////////////////
  const data = {
    ...cleanseTDKResponse(parsed.data),
    tts: ttsId ?? (await loadTTSId(parsed.data)),
  };
  return setSharedMapResult(e, "tdk", data);
});
