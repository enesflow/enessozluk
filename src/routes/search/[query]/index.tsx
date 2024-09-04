import {
  component$,
  useContextProvider,
  useStore,
  useStyles$,
} from "@builder.io/qwik";
import {
  routeLoader$,
  useLocation,
  type DocumentHead,
} from "@builder.io/qwik-city";
import { isDev } from "@builder.io/qwik/build";
import type { CollapsableStore } from "~/components/collapsable";
import {
  Collapsable,
  CollapsableCTX,
  DEFAULT_COLLAPSABLE,
  useCollapsableLoader,
} from "~/components/collapsable";
import { KubbealtiView } from "~/components/dicts/kubbealti";
import { LuggatView } from "~/components/dicts/luggat";
import { RhymeView } from "~/components/dicts/rhyme";
import { TDKView } from "~/components/dicts/tdk";
import { ExternalLink } from "~/components/externalLink";
import { SearchBar } from "~/components/search";
import { Check } from "~/components/svgs/check";
import { useBenzerLoader } from "~/helpers/dicts/benzer";
import { useKubbealtiLoader } from "~/helpers/dicts/kubbealti";
import { useLuggatLoader } from "~/helpers/dicts/luggat";
import { useNisanyanLoader } from "~/helpers/dicts/nisanyan";
import { useRhymeLoader } from "~/helpers/dicts/rhyme";
import { useTDKLoader } from "~/helpers/dicts/tdk";
import { loadSharedMap } from "~/helpers/request";
import type { Dicts } from "~/types/dicts";
import { BenzerView } from "../../../components/dicts/benzer";
import { NisanyanView } from "../../../components/dicts/nisanyan";
import styles from "~/styles/search.css?inline";
import tookStyles from "~/styles/took.css?inline";

// IMPORTANT, DON'T FORGET TO RE-EXPORT THE LOADER FUNCTIONS
export {
  useBenzerLoader,
  useCollapsableLoader,
  useKubbealtiLoader,
  useLuggatLoader,
  useNisanyanLoader,
  useRhymeLoader,
  useTDKLoader,
};

type SearchPageData = {
  tdk: string;
  nisanyan: string;
  luggat: string;
  benzer: string[];
  kubbealti: string;
  rhyme: true;
  took: number;
  allFailed: boolean;
};

export const DEV_DISABLED: Record<Dicts, boolean> = {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  tdk: true && isDev,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  nisanyan: true && isDev,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  luggat: true && isDev,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  benzer: true && isDev,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  kubbealti: false && isDev,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  "nisanyan-affix": true && isDev,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  rhyme: false && isDev,
} as const;

export const useDataLoader = routeLoader$<SearchPageData>(async (e) => {
  // const s = new Date().getTime();
  const sharedMap = loadSharedMap(e);
  const tdk = await e.resolveValue(useTDKLoader);
  const nisanyan = await e.resolveValue(useNisanyanLoader);
  const luggat = await e.resolveValue(useLuggatLoader);
  const benzer = await e.resolveValue(useBenzerLoader);
  const kubbealti = await e.resolveValue(useKubbealtiLoader);
  const rhyme = await e.resolveValue(useRhymeLoader);
  console.log(
    sharedMap.cacheTook,
    tdk.perf,
    nisanyan.perf,
    luggat.perf,
    benzer.perf,
    kubbealti.perf,
    rhyme.perf,
  );
  return {
    tdk: tdk.url,
    nisanyan: nisanyan.url,
    luggat: luggat.url,
    benzer: benzer.isUnsuccessful
      ? [benzer.url]
      : benzer.words.map((w) => w.url),
    kubbealti: kubbealti.url,
    rhyme: true,
    took:
      sharedMap.cacheTook +
      Math.max(
        tdk.perf.took,
        nisanyan.perf.took,
        luggat.perf.took,
        benzer.perf.took,
        kubbealti.perf.took,
        rhyme.perf.took,
      ),
    allFailed:
      "error" in tdk &&
      nisanyan.isUnsuccessful &&
      luggat.isUnsuccessful &&
      benzer.isUnsuccessful &&
      "serverDefinedReason" in kubbealti,
    // removing this because rhyme never fails
    /*  &&
      "serverDefinedError" in rhyme, */
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
  useStyles$(styles);
  useStyles$(tookStyles);
  const loadedCollapsable = useCollapsableLoader();
  const collapsed = useStore<CollapsableStore>(
    loadedCollapsable.value.success
      ? loadedCollapsable.value.data
      : DEFAULT_COLLAPSABLE,
  );
  useContextProvider(CollapsableCTX, collapsed);
  const loc = useLocation();
  const tdk = useTDKLoader();
  const nisanyan = useNisanyanLoader();
  const luggat = useLuggatLoader();
  const benzer = useBenzerLoader();
  const kubbealti = useKubbealtiLoader();
  const rhyme = useRhymeLoader();
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
        <Collapsable data-version={tdk.value.version} data-dict="tdk" cId="tdk">
          <h1 class="results-heading" q:slot="header">
            <CacheIndicator show={tdk.value.perf.cached} /> TDK Sonuçları:{" "}
            <ExternalLink href={data.value.tdk} />
          </h1>
          <TDKView data={tdk.value} />
        </Collapsable>
        <Collapsable
          data-version={nisanyan.value.version}
          data-dict="nisanyan"
          cId="nisanyan"
        >
          <h1 class="results-heading" q:slot="header">
            <CacheIndicator show={nisanyan.value.perf.cached} /> Nişanyan Sözlük
            Sonuçları: <ExternalLink href={data.value.nisanyan} />
          </h1>
          <NisanyanView data={nisanyan.value} />
        </Collapsable>
        <Collapsable
          data-version={kubbealti.value.version}
          data-dict="kubbealti"
          cId="kubbealti"
        >
          <h1 class="results-heading" q:slot="header">
            <CacheIndicator show={kubbealti.value.perf.cached} /> Kubbealtı
            Lugatı Sonuçları: <ExternalLink href={data.value.kubbealti} />
          </h1>
          <KubbealtiView data={kubbealti} />
        </Collapsable>
        <Collapsable
          data-version={luggat.value.version}
          data-dict="luggat"
          cId="luggat"
        >
          <h1
            class="results-heading"
            q:slot="header"
            data-version={luggat.value.version}
          >
            <CacheIndicator show={luggat.value.perf.cached} /> Luggat Sonuçları:{" "}
            <ExternalLink href={data.value.luggat} />
          </h1>
          <LuggatView data={luggat.value} />
        </Collapsable>
        <Collapsable
          data-version={benzer.value.version}
          data-dict="benzer"
          cId="benzer"
        >
          <h1 class="results-heading" q:slot="header">
            <CacheIndicator show={benzer.value.perf.cached} /> Benzer Kelimeler
            Sonuçları:{" "}
            {data.value.benzer.length === 1 && (
              <ExternalLink href={data.value.benzer[0]} />
            )}
          </h1>
          <BenzerView data={benzer} />
        </Collapsable>
        <Collapsable
          data-version={rhyme.value.version}
          data-dict="rhyme"
          cId="rhyme"
        >
          <h1 class="results-heading" q:slot="header">
            <CacheIndicator show={rhyme.value.perf.cached} /> Kâfiyeli
            Kelimeler:{" "}
          </h1>
          <RhymeView data={rhyme} />
        </Collapsable>
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
