import { component$, useStyles$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";
import { SearchBar } from "~/components/search";
import styles from "~/styles/index.css?inline";

export default component$(() => {
  useStyles$(styles);
  return (
    <>
      <div class="flex justify-center">
        <div class="obsidian-wrapper result-title">
          Yeni site{" "}
          <Link href="https://siir.enesin.xyz" class="obsidian">
            🕊️ Enes Şiir
          </Link>
        </div>
      </div>
      <div class="results-container">
        <h1 class="header">Enes Sözlük'e Hoş Geldiniz 📕</h1>
        <SearchBar />
        <div class="flex justify-center">
          <div class="new-features-wrapper">
            <strong>Yeni özellikler:</strong>
            <ul>
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
        <div class="flex justify-center">
          <img
            width="640"
            height="480"
            src="https://media.istockphoto.com/id/471480053/photo/happy-cow.jpg?s=612x612&w=0&k=20&c=IYcNcymvDBXQ6-4fbg9_2BJy5EjVVWI8RQGtolzmhko="
            alt="Cow"
            class="rounded-xl"
          />
        </div>
      </div>
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
