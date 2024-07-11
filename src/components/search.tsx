import {
  $,
  component$,
  useOnWindow,
  useSignal,
  useTask$,
} from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import { isBrowser } from "@builder.io/qwik/build";
import Spinner from "./spinner";
export const SearchBar = component$<{ value?: string }>(({ value }) => {
  const nav = useNavigate();
  const query = useSignal(value ?? "");
  const isLoading = useSignal(false);
  const input = useSignal<HTMLInputElement>();
  const loc = useLocation();
  const focusOnInput = $(() => {
    if (loc.isNavigating || !isBrowser) return;

    input.value?.focus();
    input.value?.setSelectionRange(0, input.value.value.length);
  });
  useOnWindow("load", focusOnInput);
  useTask$(({ track }) => {
    track(() => loc.isNavigating);
    focusOnInput();
  });
  return (
    <>
      <form
        preventdefault:submit
        onSubmit$={() => {
          if (query.value.length > 0) {
            isLoading.value = true;
            nav(`/search/${query.value}`).finally(() => {
              isLoading.value = false;
            });
          }
        }}
        class="search-form"
      >
        <input
          type="text"
          placeholder="Enes Sözlük'te ara..."
          bind:value={query}
          value={value}
          class="search-input"
          ref={input}
        />
        <button
          type="submit"
          class={`search-button ${isLoading.value ? "search-button-loading" : ""}`}
        >
          {isLoading.value ? (
            <span>
              <Spinner />{" "}
            </span>
          ) : (
            <span>Ara</span>
          )}
        </button>
      </form>
    </>
  );
});
