import { component$ } from "@builder.io/qwik";
import {
  RequestEventBase,
  routeLoader$,
  server$,
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
import { loadSharedMap } from "~/helpers/request";
import { BenzerView } from "../../../components/dicts/benzer";
import { NisanyanView } from "../../../components/dicts/nisanyan";
export { useBenzerLoader, useLuggatLoader, useNisanyanLoader, useTDKLoader };

type URLs = {
  tdk: string;
  nisanyan: string;
  luggat: string;
  benzer: string;
};

const test = server$(function (this: RequestEventBase) {
  console.log("test", loadSharedMap(this));
});

export const useURLsLoader = routeLoader$<URLs>(async (e) => {
  await e.resolveValue(useTDKLoader);
  await e.resolveValue(useNisanyanLoader);
  await e.resolveValue(useLuggatLoader);
  await e.resolveValue(useBenzerLoader);
  test();
  const sharedMap = loadSharedMap(e);
  console.log(sharedMap);
  return {
    tdk: "https://example.com",
    nisanyan: "https://example.com",
    luggat: "https://example.com",
    benzer: "https://example.com",
    ...sharedMap.urls,
  };
});

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
        <SearchBar value={loc.params.query} />
        <h1 style="results-heading">
          TDK Sonuçları: <ExternalLink href={urls.value.tdk} />
        </h1>
        <TDKView data={tdk.value} />
        <h1 style="results-heading">
          Nişanyan Sözlük Sonuçları: <ExternalLink href={urls.value.nisanyan} />
        </h1>
        <NisanyanView data={nisanyan.value} />
        <h1 style="results-heading">
          Luggat Sonuçları: <ExternalLink href={urls.value.luggat} />
        </h1>
        <LuggatView data={luggat.value} />
        <h1 style="results-heading">
          Benzer Kelimeler Sonuçları: <ExternalLink href={urls.value.benzer} />
        </h1>
        <BenzerView data={benzer.value} />
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
