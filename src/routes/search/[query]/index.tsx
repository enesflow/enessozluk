import { component$ } from "@builder.io/qwik";
import { useLocation, type DocumentHead } from "@builder.io/qwik-city";
import { LuggatView, useLuggatLoader } from "~/components/dicts/luggat";
import { useNisanyanLoader } from "~/components/dicts/nisanyan";
import { TDKView, useTDKLoader } from "~/components/dicts/tdk";
import { SearchBar } from "~/components/search";
import { NisanyanView } from "../../../components/dicts/nisanyan";
export { useLuggatLoader, useNisanyanLoader, useTDKLoader };

export default component$(() => {
  const loc = useLocation();
  const tdk = useTDKLoader();
  const nisanyan = useNisanyanLoader();
  const luggat = useLuggatLoader();
  return (
    <>
      <h1 class="header">{loc.params.query}</h1>
      <div class="results-container">
        <SearchBar value={loc.params.query} />
        <h1 style="results-heading">TDK Sonuçları:</h1>
        <TDKView data={tdk.value} />
        <h1 style="results-heading">NişanyanSözlük Sonunçarı:</h1>
        <NisanyanView data={nisanyan.value} />
        <h1 style="results-heading">Luggat Sonuçları:</h1>
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
