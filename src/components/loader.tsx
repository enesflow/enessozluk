import { component$, useStyles$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import styles from "~/styles/loader.css?inline";

export const Loader = component$(() => {
  useStyles$(styles);
  const loc = useLocation();

  return <>{loc.isNavigating ? <div class="loader" /> : null}</>;
});
