import type { RequestEventBase } from "@builder.io/qwik-city";
// import { isDev } from "@builder.io/qwik/build";
import { loadSharedMap } from "~/helpers/request";

export const debugLog = (...args: any[]) => {
  //isDev &&
  console.log("🛠️ DEBUG:", ...args);
};

export const debugAPI = (e: RequestEventBase, title: string) => {
  const { query } = loadSharedMap(e);
  debugLog(`[${query}] ${title}`);
};
