import { loadSharedMap } from "#helpers/request";
import type { RequestEventBase } from "@builder.io/qwik-city";
import { generateUUID } from "~/helpers/generateUUID";

export const TDK_URL = "https://sozluk.gov.tr/gts?ara=" as const;
export const TDK_RECOMMENDATIONS_URL =
  "https://sozluk.gov.tr/oneri?soz=" as const;
export const LUGGAT_URL = "https://www.luggat.com/" as const;
const NISANYAN_URL = "https://www.nisanyansozluk.com/api/words/" as const;
const NISANYAN_AFFIX_URL =
  "https://www.nisanyansozluk.com/api/affixes-1/" as const;

const baseBuilder = (
  base: string,
  e: RequestEventBase | string,
  lowercase = true,
) => {
  if (typeof e === "string") return base + e;
  else {
    const sharedMap = loadSharedMap(e);
    return base + (lowercase ? sharedMap.lowerCaseQuery : sharedMap.query);
  }
};

export const buildTDKUrl = (e: RequestEventBase | string, lowercase = true) => {
  return baseBuilder(TDK_URL, e, lowercase);
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
  return baseBuilder(LUGGAT_URL, e, lowercase);
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
  return baseBuilder(NISANYAN_URL, s, lowercase);
};

export const buildNisanyanAffixUrl = (
  e: RequestEventBase | string,
  lowercase = true,
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
  return baseBuilder(NISANYAN_AFFIX_URL, s, lowercase);
};
