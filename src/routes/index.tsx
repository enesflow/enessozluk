import { component$, useStyles$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";
import { Box } from "~/components/box";
import { SearchBar } from "~/components/search";
import { WordLink } from "~/components/WordLinks";
import styles from "~/styles/index.css?inline";

export default component$(() => {
  useStyles$(styles);
  return (
    <>
      <div class="results-container">
        <div class="flex h-24 flex-col justify-end">
          <h1 class="header">
            <Link>Enes Sözlük</Link>'e Hoş Geldiniz
          </h1>
        </div>
        <SearchBar />
      </div>
      <Box>
        <div>"Allah, Âdem’e bütün isimleri öğretti."</div>
        <div>
          "Âdem, Rabb'inden kelimeler aldı,"
          <span class="result-title-description float-right">
            Kur'an, Bakara 31, 37
          </span>
        </div>
        <div class="mt-4">
          "<WordLink word={"Kâmus"} />a uzanan el nâmusa uzanmıştır."
          <span class="result-title-description float-right">
            Cemil Meriç, 1916-1987
          </span>
        </div>
        <div class="mt-4">
          "Kelimelerin değerini anlamadan, insanların değerini anlayamazsınız."
          <span class="result-title-description float-right">
            Konfüçyüs, MÖ 551-479
          </span>
        </div>
      </Box>
      <Box>
        <strong>Yeni özellikler:</strong>
        <ul>
          <li>
            <i class="result-title-description">14 Eylül 2024 </i>
            🪪 <Link href="/search/Enes">Nişanyan Adlar</Link>
          </li>
          <li>
            <i class="result-title-description">25 Ağu 2024 </i>
            📖 <Link href="/search/kubbealtı">Kubbealtı</Link> Lugatı
          </li>
          <li>
            <i class="result-title-description">25 Ağu 2024 </i>
            🕊️ <Link href="/search/kafiye">Kâfiye</Link>li kelimeler
          </li>
        </ul>
      </Box>
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
