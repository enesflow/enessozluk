import { component$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";
import { SearchBar } from "~/components/search";
export default component$(() => {
  return (
    <>
      <div class="flex justify-center">
        <div class="obsidian-wrapper">
          Yeni site{" "}
          <Link href="https://enessiir.pages.dev" class="obsidian">
            🕊️ Enes Şiir
          </Link>
        </div>
      </div>
      <div class="results-container">
        <h1 class="header">Enes Sözlük'e Hoş Geldiniz 📕</h1>
        <SearchBar />
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
