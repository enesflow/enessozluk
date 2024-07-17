import type { RequestEventBase } from "@builder.io/qwik-city";
// import { isDev } from "@builder.io/qwik/build";
import { loadSharedMap } from "~/helpers/request";

export const debugLog = (...args: any[]) => {
  //isDev &&
  console.log("%cDEBUG:", "color: #00f; font-weight: bold;", ...args);
};

export const debugAPI = (e: RequestEventBase, title: string) => {
  const { query } = loadSharedMap(e);
  debugLog(`[${query}] TDK API Error: ${title}`);
};
