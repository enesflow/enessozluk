import { component$, Slot } from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
import { Loader } from "~/components/loader";
import { CatLookingUp } from "~/components/cat";
import { Footer } from "~/components/footer";

export const onGet: RequestHandler = async () => {
  // REMOVED CACHING FROM HERE
};

export default component$(() => {
  return (
    <>
      <Loader />
      <div class="cat-parent">
        <Slot />
        <CatLookingUp />
        <Footer />
      </div>
    </>
  );
});
