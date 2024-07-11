import { component$, useSignal, useTask$ } from "@builder.io/qwik";
import { useLocation, type DocumentHead } from "@builder.io/qwik-city";
import { LuggatView, useLuggatLoader } from "~/components/dicts/luggat";
import { useNisanyanLoader } from "~/components/dicts/nisanyan";
import { TDKView, useTDKLoader } from "~/components/dicts/tdk";
import { SearchBar } from "~/components/search";
import { NisanyanView } from "../../../components/dicts/nisanyan";
import { ExternalLink } from "~/components/externalLink";
export { useLuggatLoader, useNisanyanLoader, useTDKLoader };

type Links = {
  tdk: string;
  nisanayan: string;
  luggat: string;
};
export function getLinks(query: string): Links {
  const tdk = `https://www.sozluk.gov.tr/?aranan=${encodeURIComponent(query)}`;
  const nisanayan =
    query.startsWith("+") || query.endsWith("+")
      ? `https://www.nisanyansozluk.com/ek/${encodeURIComponent(query)}`
      : `https://www.nisanyansozluk.com/kelime/${encodeURIComponent(query)}`;
  const luggat = `https://www.luggat.com/${encodeURIComponent(query)}`;
  return { tdk, nisanayan, luggat };
}

export default component$(() => {
  const loc = useLocation();
  const tdk = useTDKLoader();
  const nisanyan = useNisanyanLoader();
  const luggat = useLuggatLoader();
  /* const links = getLinks(loc.params.query); */
  const links = useSignal<Links>();
  useTask$(({ track }) => {
    track(() => (links.value = getLinks(loc.params.query)));
  });
  return (
    <>
      <h1 class="header">{loc.params.query}</h1>
      <div class="results-container">
        <SearchBar value={loc.params.query} />
        <h1 style="results-heading">
          TDK Sonuçları: <ExternalLink href={links.value.tdk} />
        </h1>
        <TDKView data={tdk.value} />
        <h1 style="results-heading">
          Nişanyan Sözlük Sonuçları:{" "}
          <ExternalLink href={links.value.nisanayan} />
        </h1>
        <NisanyanView data={nisanyan.value} />
        <h1 style="results-heading">
          Luggat Sonuçları: <ExternalLink href={links.value.luggat} />
        </h1>
        <LuggatView data={luggat.value} />
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
