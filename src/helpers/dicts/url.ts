import { loadSharedMap } from "#helpers/request";
import type { RequestEventBase } from "@builder.io/qwik-city";
import { generateUUID } from "~/helpers/generateUUID";
import type { SharedMap } from "~/types/request";

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
export const BENZER_URL = "https://www.benzerkelimeler.com/kelime/" as const;
export const BENZER_USER_URL = BENZER_URL;

const baseBuilder = (
  base: string,
  e: RequestEventBase | string,
  lowercase = true,
  encode = false,
) => {
  let s = "";
  if (typeof e === "string") s = base + e;
  else {
    const sharedMap = loadSharedMap(e);
    s =
      base +
      (lowercase
        ? sharedMap.cleanedAndLowerCaseQuery
        : sharedMap.cleanedQuery);
  }
  return encode ? encodeURI(s) : s;
};

export const buildTDKUrl = (e: RequestEventBase | string, lowercase = true) => {
  const url = baseBuilder(TDK_URL, e, lowercase);
  if (typeof e !== "string") {
    e.sharedMap.set("data", {
      ...e.sharedMap.get("data"),
      urls: {
        ...e.sharedMap.get("data").urls,
        tdk: baseBuilder(TDK_USER_URL, e, lowercase, true),
      },
    } satisfies SharedMap);
  }
  return url;
};

export const buildTDKRecommendationsUrl = (
  e: RequestEventBase | string,
  lowercase = true,
) => {
  return baseBuilder(TDK_RECOMMENDATIONS_URL, e, lowercase);
};

export const buildLuggatUrl = (
  e: RequestEventBase | string,
  lowercase = true,
) => {
  const url = baseBuilder(LUGGAT_URL, e, lowercase);
  if (typeof e !== "string") {
    e.sharedMap.set("data", {
      ...e.sharedMap.get("data"),
      urls: {
        ...e.sharedMap.get("data").urls,
        luggat: baseBuilder(LUGGAT_USER_URL, e, lowercase, true),
      },
    } satisfies SharedMap);
  }
  return url;
};

export const buildNisanyanUrl = (
  e: RequestEventBase | string,
  lowercase = true,
) => {
  const word = (
    typeof e === "string"
      ? e
      : lowercase
        ? loadSharedMap(e).lowerCaseQuery
        : loadSharedMap(e).query
  ).replaceAll("+", "");
  let s = "";
  if (typeof e === "string") {
    s = word + `?session=${generateUUID()}`;
  } else {
    const session = e.sharedMap.get("sessionUUID") as string;
    s = word + `?session=${session}`;
  }
  const url = baseBuilder(NISANYAN_URL, s, lowercase);
  if (typeof e !== "string") {
    e.sharedMap.set("data", {
      ...e.sharedMap.get("data"),
      urls: {
        ...e.sharedMap.get("data").urls,
        nisanyan: baseBuilder(NISANYAN_USER_URL, s, lowercase, true),
      },
    } satisfies SharedMap);
  }
  return url;
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
        lowercase ? sharedMap.lowerCaseQuery : sharedMap.query,
      ) + `?session=${session}`;
  }
  const url = baseBuilder(NISANYAN_AFFIX_URL, s, lowercase, true);
  if (typeof e !== "string") {
    e.sharedMap.set("data", {
      ...e.sharedMap.get("data"),
      urls: {
        ...e.sharedMap.get("data").urls,
        nisanyan: baseBuilder(NISANYAN_AFFIX_USER_URL, s, lowercase),
      },
    } satisfies SharedMap);
  }
  return url;
};

export const buildBenzerUrl = (
  e: RequestEventBase | string,
  lowercase = false,
) => {
  const url = baseBuilder(BENZER_URL, e, lowercase);
  if (typeof e !== "string") {
    e.sharedMap.set("data", {
      ...e.sharedMap.get("data"),
      urls: {
        ...e.sharedMap.get("data").urls,
        benzer: baseBuilder(BENZER_USER_URL, e, lowercase, true),
      },
    } satisfies SharedMap);
  }
  return url;
};
