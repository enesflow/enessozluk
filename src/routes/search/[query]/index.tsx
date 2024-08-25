import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  useLocation,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { LuggatView } from "~/components/dicts/luggat";
import { TDKView } from "~/components/dicts/tdk";
import { ExternalLink } from "~/components/externalLink";
import { SearchBar } from "~/components/search";
import { Check } from "~/components/svgs/check";
import { useBenzerLoader } from "~/helpers/dicts/benzer";
import { useLuggatLoader } from "~/helpers/dicts/luggat";
import { useNisanyanLoader } from "~/helpers/dicts/nisanyan";
import { useTDKLoader } from "~/helpers/dicts/tdk";
import { loadSharedMap } from "~/helpers/request";
import { BenzerView } from "../../../components/dicts/benzer";
import { NisanyanView } from "../../../components/dicts/nisanyan";
import { isDev } from "@builder.io/qwik/build";
import { Dicts } from "~/types/dicts";
import { useKubbealtiLoader } from "~/helpers/dicts/kubbealti";
import { KubbealtiView } from "~/components/dicts/kubbealti";

// IMPORTANT, DON'T FORGET TO RE-EXPORT THE LOADER FUNCTIONS
export { useBenzerLoader, useLuggatLoader, useNisanyanLoader, useTDKLoader, useKubbealtiLoader};

type SearchPageData = {
  tdk: string;
  nisanyan: string;
  luggat: string;
  benzer: string[];
  kubbealti: string;
  took: number;
  allFailed: boolean;
};

export const DEV_DISABLED: Record<Dicts, boolean> = {
  tdk: true && isDev,
  nisanyan: true && isDev,
  luggat: true && isDev,
  benzer: true && isDev,
  kubbealti: false && isDev,
  "nisanyan-affix": true && isDev,
} as const; 

export const useDataLoader = routeLoader$<SearchPageData>(async (e) => {
  // const s = new Date().getTime();
  const sharedMap = loadSharedMap(e);
  const tdk = await e.resolveValue(useTDKLoader);
  const nisanyan = await e.resolveValue(useNisanyanLoader);
  const luggat = await e.resolveValue(useLuggatLoader);
  const benzer = await e.resolveValue(useBenzerLoader);
  const kubbealti = await e.resolveValue(useKubbealtiLoader);
  console.log(
    sharedMap.cacheTook,
    tdk.perf,
    nisanyan.perf,
    luggat.perf,
    benzer.perf,
    kubbealti.perf,
  );
  return {
    tdk: tdk.url,
    nisanyan: nisanyan.url,
    luggat: luggat.url,
    benzer: benzer.isUnsuccessful
      ? [benzer.url]
      : benzer.words.map((w) => w.url),
    kubbealti: kubbealti.url,
    took:
      sharedMap.cacheTook +
      Math.max(
        tdk.perf.took,
        nisanyan.perf.took,
        luggat.perf.took,
        benzer.perf.took,
        kubbealti.perf.took,
      ),
    allFailed:
      "error" in tdk &&
      nisanyan.isUnsuccessful &&
      luggat.isUnsuccessful &&
      benzer.isUnsuccessful &&
      "serverDefinedReason" in kubbealti,
  };
});

function formatTime(ms: number) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function getGoogleQuery(query: string) {
  return `${query} ne demek?`;
}

const CacheIndicator = component$<{ show: boolean }>(({ show }) => {
  return <>{show && <Check />}</>;
});

export default component$(() => {
  const loc = useLocation();
  const tdk = useTDKLoader();
  const nisanyan = useNisanyanLoader();
  const luggat = useLuggatLoader();
  const benzer = useBenzerLoader();
  const kubbealti = useKubbealtiLoader();
  const data = useDataLoader();
  return (
    <>
      <div class="results-container">
        <h1 class="header">{loc.params.query}</h1>
        <div class="result-title-took text-center">
          ({formatTime(data.value.took)})
        </div>
        <SearchBar value={loc.params.query} />
        {data.value.allFailed && (
          <p class="result-item">
            Google'da ara "{getGoogleQuery(loc.params.query)}"{" "}
            <ExternalLink
              href={`https://www.google.com/search?q=${encodeURIComponent(
                getGoogleQuery(loc.params.query),
              )}`}
            />
          </p>
        )}
        <div data-version={tdk.value.version} data-dict="tdk">
          <h1 style="results-heading">
            <CacheIndicator show={tdk.value.perf.cached} /> TDK Sonuçları:{" "}
            <ExternalLink href={data.value.tdk} />
          </h1>
          <TDKView data={tdk.value} />
        </div>
        <div data-version={nisanyan.value.version} data-dict="nisanyan">
          <h1 style="results-heading align-middle">
            <CacheIndicator show={nisanyan.value.perf.cached} /> Nişanyan Sözlük
            Sonuçları: <ExternalLink href={data.value.nisanyan} />
          </h1>
          <NisanyanView data={nisanyan.value} />
        </div>
        <div data-version={luggat.value.version} data-dict="luggat">
          <h1 style="results-heading" data-version={luggat.value.version}>
            <CacheIndicator show={luggat.value.perf.cached} /> Luggat Sonuçları:{" "}
            <ExternalLink href={data.value.luggat} />
          </h1>
          <LuggatView data={luggat.value} />
        </div>
        <div data-version={benzer.value.version} data-dict="benzer">
          <h1 style="results-heading">
            <CacheIndicator show={benzer.value.perf.cached} /> Benzer Kelimeler
            Sonuçları:{" "}
            {data.value.benzer.length === 1 && (
              <ExternalLink href={data.value.benzer[0]} />
            )}
          </h1>
          <BenzerView data={benzer.value} />
        </div>
        <div data-version={kubbealti.value.version} data-dict="kubbealti">
          <h1 style="results-heading">
            <CacheIndicator show={kubbealti.value.perf.cached} /> Kubbealtı Lugatı Sonuçları:{" "}
            <ExternalLink href={data.value.kubbealti} />
          </h1>
          <KubbealtiView data={kubbealti.value} />
        </div>
      </div>
    </>
  );
});

export const head: DocumentHead = ({ params }) => {
  return {
    title: `${params.query} - Enes Sözlük 📕`,
    meta: [
      {
        name: "description",
        content: `Enes Sözlük'te ${params.query} araması için sonuçlar.`,
      },
    ],
  };
};
