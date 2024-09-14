import { isDev } from "@builder.io/qwik/build";
import type { Dicts } from "~/types/dicts";

function withDev(bool: boolean): boolean {
  return bool && isDev;
}

export const DEV_DISABLED: Record<Dicts, boolean> = {
  nnames: withDev(false),
  tdk: withDev(true),
  nisanyan: withDev(true),
  luggat: withDev(true),
  benzer: withDev(true),
  kubbealti: withDev(true),
  "nisanyan-affix": withDev(true),
  rhyme: withDev(true),
} as const;
