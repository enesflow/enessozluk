import { isDev } from "@builder.io/qwik/build";
import type { Dicts } from "~/types/dicts";
export const DEV_DISABLED: Record<Dicts, boolean> = {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  tdk: false && isDev,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  nisanyan: false && isDev,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  luggat: false && isDev,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  benzer: false && isDev,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  kubbealti: false && isDev,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  "nisanyan-affix": false && isDev,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  rhyme: false && isDev,
} as const;
