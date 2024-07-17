import { loadSharedMap } from "#helpers/request";
import type { RequestEventBase } from "@builder.io/qwik-city";

export const TDK_URL = "https://sozluk.gov.tr/gts?ara=" as const;
export const TDK_RECOMMENDATIONS_URL =
  "https://sozluk.gov.tr/oneri?soz=" as const;
export const LUGGAT_URL = "https://www.luggat.com/" as const;

const baseBuilder = (
  base: string,
  e: RequestEventBase | string,
  lowercase = true,
) => {
  if (typeof e === "string") return base + e;
  else
    return (
      base +
      (lowercase ? loadSharedMap(e).lowerCaseQuery : loadSharedMap(e).query)
    );
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
