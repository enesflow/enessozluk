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
import { LuCheckCircle2, LuXCircle } from "@qwikest/icons/lucide";
import type { CollapsableStore } from "~/components/collapsable";
import {
  Collapsable,
  CollapsableCTX,
  DEFAULT_COLLAPSABLE,
  useCollapsableLoader,
} from "~/components/collapsable";
import { isKubbealtiFailed, KubbealtiView } from "~/components/dicts/kubbealti";
import { isLuggatFailed, LuggatView } from "~/components/dicts/luggat";
import { RhymeView } from "~/components/dicts/rhyme";
import {
  getTDKRecommendations,
  isTDKFailed,
  TDKView,
} from "~/components/dicts/tdk";
import { ExternalLink } from "~/components/externalLink";
import { SearchBar } from "~/components/search";
import { WordLinks } from "~/components/WordLinks";
import { useBenzerLoader } from "~/helpers/dicts/benzer";
import { useKubbealtiLoader } from "~/helpers/dicts/kubbealti";
import { useLuggatLoader } from "~/helpers/dicts/luggat";
import { useNisanyanLoader } from "~/helpers/dicts/nisanyan";
import { useRhymeLoader } from "~/helpers/dicts/rhyme";
import { useTDKLoader } from "~/helpers/dicts/tdk";
import { loadSharedMap } from "~/helpers/request";
import styles from "~/styles/search.css?inline";
import tookStyles from "~/styles/took.css?inline";
import type { Dicts } from "~/types/dicts";
import {
  BenzerView,
  getBenzerRecommendations,
  isBenzerFailed,
} from "../../../components/dicts/benzer";
import {
  getNisanyanRecommendations,
  isNisanyanFailed,
  NisanyanView,
} from "../../../components/dicts/nisanyan";

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
  recommendations?: string[];
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
  kubbealti: true && isDev,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  "nisanyan-affix": true && isDev,
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  rhyme: true && isDev,
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
      isTDKFailed(tdk) &&
      isNisanyanFailed(nisanyan) &&
      isLuggatFailed(luggat) &&
      isBenzerFailed(benzer) &&
      isKubbealtiFailed(kubbealti),
    //rhyme never fails
    recommendations: recommendations.length ? recommendations : undefined,
  };
});

function formatTime(ms: number) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function getGoogleQuery(query: string) {
  return `${query} ne demek?`;
}

const Icon = component$<{ show: boolean; failed: boolean }>(
  ({ show, failed }) => {
    return (
      <>
        {failed ? (
          <>
            <LuXCircle class="mb-0.5 inline w-auto text-red-500" />
          </>
        ) : (
          <>{show && <LuCheckCircle2 class="mb-0.5 inline w-auto" />}</>
        )}
      </>
    );
  },
);

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

        {data.value.recommendations && (
          <div class="result-item result-subitem">
            Öneriler: <WordLinks words={data.value.recommendations} />
          </div>
        )}
        <div class="relative">
          <Collapsable
            data-version={tdk.value.version}
            id="tdk"
            cId="tdk"
            defaultClosed={isTDKFailed(tdk.value)}
          >
            <h1 class="results-heading" q:slot="header">
              <Icon
                show={tdk.value.perf.cached}
                failed={isTDKFailed(tdk.value)}
              />{" "}
              TDK Sonuçları: <ExternalLink href={data.value.tdk} />
            </h1>
            <TDKView data={tdk.value} />
          </Collapsable>
          <Collapsable
            data-version={nisanyan.value.version}
            id="nisanyan"
            cId="nisanyan"
            defaultClosed={isNisanyanFailed(nisanyan.value)}
          >
            <h1 class="results-heading" q:slot="header">
              <Icon
                show={nisanyan.value.perf.cached}
                failed={isNisanyanFailed(nisanyan.value)}
              />{" "}
              Nişanyan Sözlük Sonuçları:{" "}
              <ExternalLink href={data.value.nisanyan} />
            </h1>
            <NisanyanView data={nisanyan.value} />
          </Collapsable>
          <Collapsable
            data-version={kubbealti.value.version}
            id="kubbealti"
            cId="kubbealti"
            defaultClosed={isKubbealtiFailed(kubbealti.value)}
          >
            <h1 class="results-heading" q:slot="header">
              <Icon
                show={kubbealti.value.perf.cached}
                failed={isKubbealtiFailed(kubbealti.value)}
              />{" "}
              Kubbealtı Lugatı Sonuçları:{" "}
              <ExternalLink href={data.value.kubbealti} />
            </h1>
            <KubbealtiView data={kubbealti} />
          </Collapsable>
          <Collapsable
            data-version={luggat.value.version}
            id="luggat"
            cId="luggat"
            defaultClosed={isLuggatFailed(luggat.value)}
          >
            <h1
              class="results-heading"
              q:slot="header"
              data-version={luggat.value.version}
            >
              <Icon
                show={luggat.value.perf.cached}
                failed={isLuggatFailed(luggat.value)}
              />{" "}
              Luggat Sonuçları: <ExternalLink href={data.value.luggat} />
            </h1>
            <LuggatView data={luggat.value} />
          </Collapsable>
          <Collapsable
            data-version={benzer.value.version}
            id="benzer"
            cId="benzer"
            defaultClosed={isBenzerFailed(benzer.value)}
          >
            <h1 class="results-heading" q:slot="header">
              <Icon
                show={benzer.value.perf.cached}
                failed={isBenzerFailed(benzer.value)}
              />{" "}
              Benzer Kelimeler Sonuçları:{" "}
              {data.value.benzer.length === 1 && (
                <ExternalLink href={data.value.benzer[0]} />
              )}
            </h1>
            <BenzerView data={benzer} />
          </Collapsable>
          <Collapsable
            data-version={rhyme.value.version}
            id="rhyme"
            cId="rhyme"
            defaultClosed={false}
          >
            <h1 class="results-heading" q:slot="header">
              <Icon show={rhyme.value.perf.cached} failed={false} /> Kâfiyeli
              Kelimeler:{" "}
            </h1>
            <RhymeView data={rhyme} />
          </Collapsable>
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
