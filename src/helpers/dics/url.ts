import { loadSharedMap } from "#helpers/request";
import type { RequestEventBase } from "@builder.io/qwik-city";

export const TDK_URL = "https://sozluk.gov.tr/gts?ara=" as const;
export const TDK_RECOMMENDATIONS_URL =
  "https://sozluk.gov.tr/oneri?soz=" as const;

const baseBuilder = (base: string, e: RequestEventBase | string) => {
  if (typeof e === "string") return base + e;
  else return base + loadSharedMap(e).lowerCaseQuery;
};

export const buildTDKUrl = (e: RequestEventBase | string) => {
  return baseBuilder(TDK_URL, e);
};

export const buildTDKRecommendationsUrl = (e: RequestEventBase | string) => {
  return baseBuilder(TDK_RECOMMENDATIONS_URL, e);
};
