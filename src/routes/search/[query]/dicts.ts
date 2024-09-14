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
// IMPORTANT, DON'T FORGET TO RE-EXPORT THE LOADER FUNCTIONS
export {
  useBenzerLoader,
  useCollapsableLoader,
  useKubbealtiLoader,
  useLuggatLoader,
  useNisanyanLoader,
  useNNamesLoader,
  useRhymeLoader,
  useTDKLoader,
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
