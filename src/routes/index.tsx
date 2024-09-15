import { component$, useStyles$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";
import { CatLookingUp } from "~/components/cat";
import { SearchBar } from "~/components/search";
import styles from "~/styles/index.css?inline";

export default component$(() => {
  useStyles$(styles);
  return (
    <div class="cat-parent">
      <div class="flex justify-center">
        <div class="obsidian-wrapper result-title">
          Yeni site{" "}
          <Link href="https://siir.enesin.xyz" class="obsidian">
            🕊️ Enes Şiir
          </Link>
        </div>
      </div>
      <div class="results-container">
        <h1 class="header">
          <Link>Enes Sözlük</Link>'e Hoş Geldiniz
        </h1>
        <SearchBar />
        <div class="flex justify-center">
          <div class="new-features-wrapper nice-w redish-tinted-background">
            <strong>Yeni özellikler:</strong>
            <ul>
              <li>
                <i class="opacity-50">14 Eylül 2024 </i>
                🪪 <Link href="/search/Enes">Nişanyan Adlar</Link>
              </li>
              <li>
                <i class="opacity-50">25 Ağu 2024 </i>
                📖 <Link href="/search/kubbealtı">Kubbealtı</Link> Lugatı
              </li>
              <li>
                <i class="opacity-50">25 Ağu 2024 </i>
                🕊️ <Link href="/search/kafiye">Kâfiye</Link>li kelimeler
              </li>
            </ul>
          </div>
        </div>
        <CatLookingUp />
      </div>
    </div>
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
