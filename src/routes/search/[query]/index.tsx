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
import { useBenzerLoader } from "~/helpers/dicts/benzer";
import { useLuggatLoader } from "~/helpers/dicts/luggat";
import { useNisanyanLoader } from "~/helpers/dicts/nisanyan";
import { useTDKLoader } from "~/helpers/dicts/tdk";
import { BenzerView } from "../../../components/dicts/benzer";
import { NisanyanView } from "../../../components/dicts/nisanyan";
export { useBenzerLoader, useLuggatLoader, useNisanyanLoader, useTDKLoader };

type SearchPageData = {
  tdk: string;
  nisanyan: string;
  luggat: string;
  benzer: string[];
  // took: number;
};

export const useURLsLoader = routeLoader$<SearchPageData>(async (e) => {
  // const s = new Date().getTime();
  const tdk = await e.resolveValue(useTDKLoader);
  const nisanyan = await e.resolveValue(useNisanyanLoader);
  const luggat = await e.resolveValue(useLuggatLoader);
  const benzer = await e.resolveValue(useBenzerLoader);
  // const took = new Date().getTime() - s; // this date does not change on cloudflare
  return {
    tdk: tdk.url,
    nisanyan: nisanyan.url,
    luggat: luggat.url,
    benzer: benzer.isUnsuccessful
      ? [benzer.url]
      : benzer.words.map((w) => w.url),
    // took,
  };
});

/* function formatTime(ms: number) {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
} */

export default component$(() => {
  const loc = useLocation();
  const tdk = useTDKLoader();
  const nisanyan = useNisanyanLoader();
  const luggat = useLuggatLoader();
  const benzer = useBenzerLoader();
  // const links = useComputed$(() => getLinks(loc.params.query));
  const urls = useURLsLoader();
  return (
    <>
      <div class="results-container">
        <h1 class="header">{loc.params.query}</h1>
        {/* <div class="result-title-took text-center">
          ({formatTime(urls.value.took)})
        </div> */}
        <SearchBar value={loc.params.query} />
        <div data-version={tdk.value.version} data-dict="tdk">
          <h1 style="results-heading">
            TDK Sonuçları: <ExternalLink href={urls.value.tdk} />
          </h1>
          <TDKView data={tdk.value} />
        </div>
        <div data-version={nisanyan.value.version} data-dict="nisanyan">
          <h1 style="results-heading">
            Nişanyan Sözlük Sonuçları:{" "}
            <ExternalLink href={urls.value.nisanyan} />
          </h1>
          <NisanyanView data={nisanyan.value} />
        </div>
        <div data-version={luggat.value.version} data-dict="luggat">
          <h1 style="results-heading" data-version={luggat.value.version}>
            Luggat Sonuçları: <ExternalLink href={urls.value.luggat} />
          </h1>
          <LuggatView data={luggat.value} />
        </div>
        <div data-version={benzer.value.version} data-dict="benzer">
          <h1 style="results-heading">
            Benzer Kelimeler Sonuçları:{" "}
            {urls.value.benzer.length === 1 && (
              <ExternalLink href={urls.value.benzer[0]} />
            )}
          </h1>
          <BenzerView data={benzer.value} />
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
