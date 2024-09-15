import { isDev } from "@builder.io/qwik/build";
import type { Dicts } from "~/types/dicts";

function withDev(bool: boolean): boolean {
  return bool && isDev;
}

export const DEV_DISABLED: Record<Dicts, boolean> = {
  nnames: withDev(false),
  tdk: withDev(false),
  nisanyan: withDev(false),
  luggat: withDev(false),
  benzer: withDev(false),
  kubbealti: withDev(false),
  "nisanyan-affix": withDev(false),
  rhyme: withDev(false),
} as const;
