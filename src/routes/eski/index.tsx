import { component$, useStyles$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";
import styles from "~/styles/index.css?inline";

export default component$(() => {
  useStyles$(styles);
  return (
    <div class="results-container">
      <h1 class="header">Sitemiz taşındı ❗️</h1>
      <div class="flex justify-center">
        <div class="result-title redish-tinted-background mb-4 rounded-md border-2 border-red-500 bg-red-100 px-4 py-2">
          Yeni alan adı{" "}
          <Link href="https://sozluk.enesin.xyz">sozluk.enesin.xyz</Link>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Yeni alan adı",
  meta: [
    {
      name: "description",
      content: "Yeni alan adından devam edin.",
    },
  ],
};
