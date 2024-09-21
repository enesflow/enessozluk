import { loadSharedMap } from "#helpers/request";
import type { RequestEventBase } from "@builder.io/qwik-city";
import { generateUUID } from "~/helpers/generateUUID";
import { clearAccent } from "~/routes/plugin";

export const TDK_TTS_URL = "https://sozluk.gov.tr/ses/" as const;
export const TDK_URL = "https://sozluk.gov.tr/gts?ara=" as const;
export const TDK_USER_URL = "https://www.sozluk.gov.tr/?aranan=" as const;
export const TDK_RECOMMENDATIONS_URL =
  "https://sozluk.gov.tr/oneri?soz=" as const;
export const LUGGAT_URL = "https://www.luggat.com/" as const;
export const LUGGAT_USER_URL = LUGGAT_URL;
export const NISANYAN_URL =
  "https://www.nisanyansozluk.com/api/words/" as const;
export const NISANYAN_USER_URL =
  "https://www.nisanyansozluk.com/kelime/" as const;
export const NISANYAN_AFFIX_URL =
  "https://www.nisanyansozluk.com/api/affixes-1/" as const;
export const NISANYAN_AFFIX_USER_URL =
  "https://www.nisanyansozluk.com/ek/" as const;
export const NISANYAN_NAMES_URL =
  "https://www.nisanyanadlar.com/api/names/" as const;
export const NISANYAN_NAMES_USER_URL =
  "https://www.nisanyanadlar.com/isim/" as const;
export const BENZER_URL = "https://www.benzerkelimeler.com/kelime/" as const;
export const BENZER_USER_URL = BENZER_URL;
export const BENZER_ADVANCED_URL = "https://www.benzerkelimeler.com/" as const;
// "https://www.benzerkelimeler.com/deniz-ile-baslayan-deniz-ile-biten-kelimeler";
export const KUBBEALTI_URL = "https://eski.lugatim.com/rest/s/" as const;
export const KUBBEALTI_USER_URL = "https://lugatim.com/s/" as const;
export const KUBBEALTI_TTS_URL = "https://lugatim.com/static/media/" as const;

const baseBuilder = (
  base: string,
  e: RequestEventBase | string,
  lowercase = true,
  encode = true,
) => {
  const encoder = encode ? encodeURIComponent : (e: string) => e;
  let s = "";
  if (typeof e === "string") s = base + encoder(e);
  else {
    const sharedMap = loadSharedMap(e);
    s =
      base +
      encoder(
        lowercase
          ? sharedMap.query.noNumEtcParenAccL
          : sharedMap.query.noNumEtcParenAcc,
      );
  }
  return s;
};

export const buildTDKUrl = (e: RequestEventBase | string, lowercase = true) => {
  return {
    api: baseBuilder(TDK_URL, e, lowercase),
    user: baseBuilder(TDK_USER_URL, e, lowercase, false),
  };
};

export const buildTDKRecommendationsUrl = (
  e: RequestEventBase | string,
  lowercase = true,
) => {
  return {
    api: baseBuilder(TDK_RECOMMENDATIONS_URL, e, lowercase),
    user: baseBuilder(TDK_URL, e, lowercase),
  };
};

export const buildLuggatUrl = (
  e: RequestEventBase | string,
  lowercase = true,
) => {
  return {
    api: baseBuilder(LUGGAT_URL, e, lowercase),
    user: baseBuilder(LUGGAT_USER_URL, e, lowercase),
  };
};

export const buildNisanyanUrl = (
  e: RequestEventBase | string,
  lowercase = true,
) => {
  const word = encodeURIComponent(
    typeof e === "string"
      ? e
      : lowercase
        ? loadSharedMap(e).query.noNumEtcParenAccL
        : loadSharedMap(e).query.noNumEtcParenAcc,
  );

  let s = "";
  if (typeof e === "string") {
    s = word + `?session=${generateUUID()}`;
  } else {
    const session = e.sharedMap.get("sessionUUID") as string;
    s = word + `?session=${session}`;
  }
  return {
    api: baseBuilder(NISANYAN_URL, s, lowercase, false),
    user: baseBuilder(NISANYAN_USER_URL, word, lowercase, false),
  };
};

export const buildNisanyanAffixUrl = (
  e: RequestEventBase | string,
  lowercase = false,
) => {
  let s = "";
  if (typeof e === "string") {
    s = encodeURIComponent(e) + `?session=${generateUUID()}`;
  } else {
    const session = e.sharedMap.get("sessionUUID") as string;
    const sharedMap = loadSharedMap(e);
    s =
      encodeURIComponent(
        lowercase ? sharedMap.query.noNumL : sharedMap.query.noNum,
      ) + `?session=${session}`;
  }
  return {
    api: baseBuilder(NISANYAN_AFFIX_URL, s, lowercase, false),
    user: baseBuilder(NISANYAN_AFFIX_USER_URL, s, lowercase, false),
  };
};

export const buildBenzerUrl = (
  e: RequestEventBase | string,
  lowercase = false,
) => {
  return {
    api: baseBuilder(BENZER_URL, e, lowercase),
    user: baseBuilder(BENZER_USER_URL, e, lowercase),
  };
};

export const buildBenzerAdvancedUrl = (e: RequestEventBase | string) => {
  const s =
    typeof e === "string"
      ? clearAccent(e).toLocaleLowerCase("tr")
      : loadSharedMap(e).query.noNumEtcParenAccL;
  // replace a, e, i, ı, o, ö, u, ü with _
  const replaced = encodeURIComponent(s.replace(/[aeıioöuü]/g, "_"));
  const url = `${BENZER_ADVANCED_URL}${replaced}-ile-baslayan-${replaced}-ile-biten-kelimeler`;
  return {
    api: url,
    user: url,
  };
};

export const buildKubbealtiUrl = (
  e: RequestEventBase | string,
  lowercase = false,
) => {
  if (typeof e === "string") {
    return {
      api: baseBuilder(KUBBEALTI_URL, e, lowercase),
      user: baseBuilder(KUBBEALTI_USER_URL, e, lowercase),
    };
  }
  const sharedMap = loadSharedMap(e);
  let query = sharedMap.query.noNumEtcParenAccL;
  if (query[0] === "–") query = query.slice(1);
  return {
    api: baseBuilder(KUBBEALTI_URL, query, lowercase),
    user: baseBuilder(KUBBEALTI_USER_URL, query, lowercase),
  };
};
export const buildNisanyanNamesUrl = (
  e: RequestEventBase | string,
  lowercase = true,
) => {
  const word = encodeURIComponent(
    typeof e === "string"
      ? e
      : lowercase
        ? loadSharedMap(e).query.noNumEtcParenAccL
        : loadSharedMap(e).query.noNumEtcParenAcc,
  );

  let s = "";
  if (typeof e === "string") {
    s = word + `?session=${generateUUID()}`;
  } else {
    const session = e.sharedMap.get("sessionUUID") as string;
    s = word + `?session=${session}`;
  }
  return {
    api: baseBuilder(NISANYAN_NAMES_URL, s, lowercase, false),
    user: baseBuilder(NISANYAN_NAMES_USER_URL, word, lowercase, false),
  };
};
