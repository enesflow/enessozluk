import { removeNumbersInWord } from "#helpers/string";
import { component$, useComputed$ } from "@builder.io/qwik";
import { useLocation, type DocumentHead } from "@builder.io/qwik-city";
import { LuggatView, useLuggatLoader } from "~/components/dicts/luggat";
import { useNisanyanLoader } from "~/components/dicts/nisanyan";
import { TDKView, useTDKLoader } from "~/components/dicts/tdk";
import { ExternalLink } from "~/components/externalLink";
import { SearchBar } from "~/components/search";
import { NisanyanView } from "../../../components/dicts/nisanyan";
import { BenzerView, useBenzerLoader } from "../../../components/dicts/benzer";
export { useLuggatLoader, useNisanyanLoader, useTDKLoader, useBenzerLoader };

type Links = {
  tdk: string;
  nisanayan: string;
  luggat: string;
  benzer: string;
};
export function getLinks(query: string): Links {
  const tdk = `https://www.sozluk.gov.tr/?aranan=${encodeURIComponent(query)}`;
  const nisanayan =
    query.startsWith("+") || removeNumbersInWord(query).endsWith("+")
      ? `https://www.nisanyansozluk.com/ek/${encodeURIComponent(query)}`
      : `https://www.nisanyansozluk.com/kelime/${encodeURIComponent(query)}`;
  const luggat = `https://www.luggat.com/${encodeURIComponent(query)}`;
  const benzer = `https://www.benzerkelimeler.com/kelime/${encodeURIComponent(query)}`;
  return { tdk, nisanayan, luggat, benzer };
}

export default component$(() => {
  const loc = useLocation();
  const tdk = useTDKLoader();
  const nisanyan = useNisanyanLoader();
  const luggat = useLuggatLoader();
  const benzer = useBenzerLoader();
  const links = useComputed$(() => getLinks(loc.params.query));
  return (
    <>
      <div class="results-container">
        <h1 class="header">{loc.params.query}</h1>
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
        <h1 style="results-heading">
          Benzer Kelimeler Sonuçları: <ExternalLink href={links.value.benzer} />
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
