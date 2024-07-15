import { component$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";

export const Loader = component$(() => {
  const loc = useLocation();

  return <>{loc.isNavigating ? <div class="loader" /> : null}</>;
});
