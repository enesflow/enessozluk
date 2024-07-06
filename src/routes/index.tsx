import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { SearchBar } from "~/components/search";

export default component$(() => {
  return (
    <>
      <h1 class="header">Enes Sözlük'e Hoş Geldiniz 📕</h1>
      <SearchBar />
    </>
  );
});

export const head: DocumentHead = {
  title: "Enes Sözlük 📕",
  meta: [
    {
      name: "description",
      content: "Enes Sözlük'e hoş geldiniz. Türkçe sözlüklerde arama yapın.",
    },
  ],
};
