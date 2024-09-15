import ImgCatup from "/public/images/catup.png?jsx";
import {
  component$,
  useContextProvider,
  useStore,
  useStyles$,
} from "@builder.io/qwik";
import { useLocation, type DocumentHead } from "@builder.io/qwik-city";
import type { CollapsableStore } from "~/components/collapsable";
import {
  Collapsable,
  CollapsableCTX,
  DEFAULT_COLLAPSABLE,
  useCollapsableLoader,
} from "~/components/collapsable";
import { BenzerView } from "~/components/dicts/benzer";
import { isKubbealtiFailed, KubbealtiView } from "~/components/dicts/kubbealti";
import { isLuggatFailed, LuggatView } from "~/components/dicts/luggat";
import { NisanyanView } from "~/components/dicts/nisanyan";
import { RhymeView } from "~/components/dicts/rhyme";
import { isTDKFailed, TDKView } from "~/components/dicts/tdk";
import { ExternalLink } from "~/components/externalLink";
import { SearchBar } from "~/components/search";
import { WordLinks } from "~/components/WordLinks";
import { useBenzerLoader } from "~/helpers/dicts/benzer";
import { useKubbealtiLoader } from "~/helpers/dicts/kubbealti";
import { useLuggatLoader } from "~/helpers/dicts/luggat";
import { useNisanyanLoader } from "~/helpers/dicts/nisanyan";
import { useRhymeLoader } from "~/helpers/dicts/rhyme";
import { useTDKLoader } from "~/helpers/dicts/tdk";
import styles from "~/styles/search.css?inline";
import tookStyles from "~/styles/took.css?inline";
import { BENZER_VERSION } from "~/types/benzer";
import type { Dicts } from "~/types/dicts";
import { KUBBEALTI_VERSION } from "~/types/kubbealti";
import { LUGGAT_VERSION } from "~/types/luggat";
import { NISANYAN_VERSION } from "~/types/nisanyan";
import { RHYME_VERSION } from "~/types/rhyme";
import { TDK_VERSION } from "~/types/tdk";
import { isBenzerFailed } from "../../../components/dicts/benzer";
import { isNisanyanFailed } from "../../../components/dicts/nisanyan";
import type { Dict, DictsArray } from "./dicts";
import { HeaderIcon } from "./headericon";
import type { SearchPageData } from "./metaData";
import { useMetaDataLoader } from "./metaData";
import { useNNamesLoader } from "~/helpers/dicts/nnames";
import { NNAMES_VERSION } from "~/types/nnames";
import { isNNamesFailed, NNamesView } from "~/components/dicts/nnames";
import { useQueryLoader } from "~/types/request";

// IMPORTANT, DON'T FORGET TO RE-EXPORT THE LOADER FUNCTIONS
export {
  useBenzerLoader,
  useCollapsableLoader,
  useKubbealtiLoader,
  useLuggatLoader,
  useNisanyanLoader,
  useRhymeLoader,
  useTDKLoader,
  useMetaDataLoader,
  useNNamesLoader,
  useQueryLoader,
};

export const dictionaries = {
  tdk: {
    loader: useTDKLoader,
    version: TDK_VERSION,
    view: TDKView,
    isFailed: isTDKFailed,
    readable: "TDK",
    requiresSignal: false,
  },
  nisanyan: {
    loader: useNisanyanLoader,
    version: NISANYAN_VERSION,
    view: NisanyanView,
    isFailed: isNisanyanFailed,
    readable: "Nişanyan Sözlük",
    requiresSignal: false,
  },
  luggat: {
    loader: useLuggatLoader,
    version: LUGGAT_VERSION,
    view: LuggatView,
    isFailed: isLuggatFailed,
    readable: "Luggat",
    requiresSignal: false,
  },
  benzer: {
    loader: useBenzerLoader,
    version: BENZER_VERSION,
    view: BenzerView,
    isFailed: isBenzerFailed,
    readable: "Benzer Kelimeler",
    requiresSignal: true,
  },
  kubbealti: {
    loader: useKubbealtiLoader,
    version: KUBBEALTI_VERSION,
    view: KubbealtiView,
    isFailed: isKubbealtiFailed,
    readable: "Kubbealtı Lugatı",
    requiresSignal: true,
  },
  rhyme: {
    loader: useRhymeLoader,
    version: RHYME_VERSION,
    view: RhymeView,
    isFailed: () => false, // metaData.allFailed can be used
    readable: "Kâfiyeli Kelimeler",
    requiresSignal: true,
  },
  nnames: {
    loader: useNNamesLoader,
    version: NNAMES_VERSION,
    view: NNamesView,
    isFailed: isNNamesFailed,
    readable: "Nişanyan Adlar",
    requiresSignal: false,
  },
} as const satisfies Record<Exclude<Dicts, "nisanyan-affix">, Dict>;

function formatTime(ms: number) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function getGoogleQuery(query: string) {
  return `${query} ne demek?`;
}

const Results = component$<{
  metaData: SearchPageData;
}>(({ metaData }) => {
  const sort: DictsArray = [
    "tdk",
    "nisanyan",
    "kubbealti",
    "luggat",
    "nnames",
    "benzer",
    "rhyme",
  ];

  const datas = Object.fromEntries(
    sort.map((name) => {
      const dict = dictionaries[name];
      // TODO: WTF IS THIS?
      const loader = name === "kubbealti" ? useKubbealtiLoader : dict.loader;
      if (!(loader as any)) {
        throw new Error(`Loader not found for ${name}`);
      }
      return [name, loader()];
    }),
  );

  return (
    <>
      {sort
        // sort by isFailed is false
        .sort((a, b) => {
          const aFailed = dictionaries[a].isFailed(datas[a].value as any);
          const bFailed = dictionaries[b].isFailed(datas[b].value as any);
          if (aFailed && !bFailed) return 1;
          if (!aFailed && bFailed) return -1;
          return 0;
        })
        .map((name) => {
          const dict = dictionaries[name];
          const data = datas[name];
          const isFailed = dict.isFailed(data.value as any);
          return (
            <Collapsable
              data-version={data.value.version}
              id={name}
              cId={name}
              defaultClosed={isFailed}
              key={name}
            >
              <h1 class="results-heading" q:slot="header">
                <HeaderIcon show={data.value.perf.cached} failed={isFailed} />{" "}
                {dict.readable} Sonuçları:{" "}
                {name !== "benzer" && name !== "rhyme" && (
                  <ExternalLink href={metaData[name]} />
                )}
                {name === "benzer" &&
                  "words" in data.value &&
                  data.value.words?.length === 1 && (
                    <ExternalLink href={metaData.benzer[0]} />
                  )}
              </h1>
              {/* @ts-expect-error */}
              <dict.view data={dict.requiresSignal ? data : data.value} />
            </Collapsable>
          );
        })}
    </>
  );
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
  const data = useMetaDataLoader();
  return (
    <div class="relative min-h-[calc(100vh-3rem)]">
      {" "}
      {/* 1rem is for mt-4 for .results-container, 1rem is for p-4 for body */}
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
          <Results metaData={data.value} />
        </div>
        <div>
          <div class="pb-96" />
          <ImgCatup alt="catup" class="absolute -bottom-4 left-0 h-96 w-auto" />
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = ({ params }) => {
  return {
    title: `"${params.query}" ne demek? ${Object.keys(dictionaries).length} kaynaktan sonuçlar.`,
    meta: [
      {
        name: "description",
        content: `${Object.values(dictionaries)
          .map((d) => d.readable)
          .join(", ")} sözlüklerinde ${params.query} araması için sonuçlar.`,
      },
    ],
  };
};
