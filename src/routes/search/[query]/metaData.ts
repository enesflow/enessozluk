import { routeLoader$ } from "@builder.io/qwik-city";
import { isKubbealtiFailed } from "~/components/dicts/kubbealti";
import { isLuggatFailed } from "~/components/dicts/luggat";
import { getTDKRecommendations, isTDKFailed } from "~/components/dicts/tdk";
import {
  useBenzerLoader,
  useKubbealtiLoader,
  useLuggatLoader,
  useNisanyanLoader,
  useRhymeLoader,
  useTDKLoader,
} from "~/routes/search/[query]/index";
import { loadSharedMap } from "~/helpers/request";
import {
  getBenzerRecommendations,
  isBenzerFailed,
} from "~/components/dicts/benzer";
import {
  getNisanyanRecommendations,
  isNisanyanFailed,
} from "~/components/dicts/nisanyan";
import { useNNamesLoader } from "~/helpers/dicts/nnames";
import { isNNamesFailed } from "~/components/dicts/nnames";
export type SearchPageData = {
  tdk: string;
  nisanyan: string;
  luggat: string;
  benzer: string[];
  kubbealti: string;
  rhyme: string;
  nnames: string;
  // -------------------
  took: number;
  allFailed: boolean;
  recommendations?: string[];
};

// eslint-disable-next-line qwik/loader-location
export const useMetaDataLoader = routeLoader$<SearchPageData>(async (e) => {
  // const s = new Date().getTime();
  const sharedMap = loadSharedMap(e);
  const tdk = await e.resolveValue(useTDKLoader);
  const nisanyan = await e.resolveValue(useNisanyanLoader);
  const luggat = await e.resolveValue(useLuggatLoader);
  const benzer = await e.resolveValue(useBenzerLoader);
  const kubbealti = await e.resolveValue(useKubbealtiLoader);
  const rhyme = await e.resolveValue(useRhymeLoader);
  const nnames = await e.resolveValue(useNNamesLoader);
  console.log({
    "cache took": sharedMap.cacheTook,
    tdk: tdk.perf,
    nisanyan: nisanyan.perf,
    luggat: luggat.perf,
    benzer: benzer.perf,
    kubbealti: kubbealti.perf,
    rhyme: rhyme.perf,
  });
  const recommendations = Array.from(
    new Set([
      ...(isTDKFailed(tdk) ? getTDKRecommendations(tdk) : []),
      ...(isNisanyanFailed(nisanyan)
        ? getNisanyanRecommendations(nisanyan)
        : []),
      ...(isBenzerFailed(benzer) ? getBenzerRecommendations(benzer) : []),
    ]),
  );
  const metaData = {
    tdk: tdk.url,
    nisanyan: nisanyan.url,
    luggat: luggat.url,
    benzer: benzer.isUnsuccessful
      ? [benzer.url]
      : benzer.words.map((w) => w.url),
    kubbealti: kubbealti.url,
    rhyme: "#",
    nnames: nnames.url,
    took:
      sharedMap.cacheTook +
      Math.max(
        tdk.perf.took,
        nisanyan.perf.took,
        luggat.perf.took,
        benzer.perf.took,
        kubbealti.perf.took,
        rhyme.perf.took,
        nnames.perf.took,
      ),
    allFailed:
      isTDKFailed(tdk) &&
      isNisanyanFailed(nisanyan) &&
      isLuggatFailed(luggat) &&
      isBenzerFailed(benzer) &&
      isKubbealtiFailed(kubbealti) &&
      isNNamesFailed(nnames),
    //rhyme never fails
    recommendations: recommendations.length ? recommendations : undefined,
  };
  e.sharedMap.set("metaData", metaData);
  return metaData;
});
