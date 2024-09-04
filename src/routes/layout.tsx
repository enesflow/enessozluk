import { component$, Slot } from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
import { Loader } from "~/components/loader";

export const onGet: RequestHandler = async () => {
  // REMOVED CACHING FROM HERE
};

export default component$(() => {
  return (
    <>
      <Loader />
      <Slot />
    </>
  );
});
