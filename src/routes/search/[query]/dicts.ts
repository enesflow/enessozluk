import type { Component } from "@builder.io/qwik";
import {
  useBenzerLoader,
  useCollapsableLoader,
  useKubbealtiLoader,
  useLuggatLoader,
  useNisanyanLoader,
  useNNamesLoader,
  useRhymeLoader,
  useTDKLoader,
} from "~/routes/search/[query]/index";
import type { Dicts } from "~/types/dicts";
import { BenzerPackageSchema } from "~/types/benzer";
import { KubbealtiPackageSchema } from "~/types/kubbealti";
import { LuggatPackageSchema } from "~/types/luggat";
import { NisanyanWordPackageSchema } from "~/types/nisanyan";
import { RhymePackageSchema } from "~/types/rhyme";
import { TDKPackageSchema } from "~/types/tdk";
import { NNamesPackageSchema } from "~/types/nnames";
// IMPORTANT, DON'T FORGET TO RE-EXPORT THE LOADER FUNCTIONS
export {
  useBenzerLoader,
  useCollapsableLoader,
  useKubbealtiLoader,
  useLuggatLoader,
  useNisanyanLoader,
  useRhymeLoader,
  useTDKLoader,
  useNNamesLoader,
};

export type Dict = {
  loader: (...args: any[]) => any;
  version: string;
  view: Component<any>;
  isFailed: (...args: any[]) => boolean;
  readable: string;
  requiresSignal: boolean;
};

export type DictsArray = Array<Exclude<Dicts, "nisanyan-affix">>;

export const Packages = {
  tdk: TDKPackageSchema,
  luggat: LuggatPackageSchema,
  "nisanyan-affix": NisanyanWordPackageSchema,
  benzer: BenzerPackageSchema,
  nisanyan: NisanyanWordPackageSchema,
  nnames: NNamesPackageSchema,
  kubbealti: KubbealtiPackageSchema,
  rhyme: RhymePackageSchema,
} as const;
