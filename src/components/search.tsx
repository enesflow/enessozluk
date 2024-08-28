import {
  $,
  component$,
  useOnDocument,
  useOnWindow,
  useSignal,
  useTask$,
} from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import { isBrowser } from "@builder.io/qwik/build";
import Spinner from "./spinner";
export const SearchBar = component$<{ value?: string }>(({ value }) => {
  const placeholderRef = useSignal<HTMLFormElement>();
  const formRef = useSignal<HTMLFormElement>();
  const fixToTop = useSignal(false);
  const nav = useNavigate();
  const query = useSignal(value ?? "");
  const isLoading = useSignal(false);
  const input = useSignal<HTMLInputElement>();
  const loc = useLocation();
  const focusOnInput = $(() => {
    if (loc.isNavigating || !isBrowser) return;
    // if on a mobile device, this would annoy the user
    if (typeof screen.orientation !== "undefined") return;
    input.value?.focus();
    input.value?.setSelectionRange(0, input.value.value.length);
  });
  useOnWindow("load", focusOnInput);
  useTask$(({ track }) => {
    track(() => loc.isNavigating);
    focusOnInput();
  });
  useOnDocument(
    "scroll",
    $(() => {
      const formTop = placeholderRef.value?.getBoundingClientRect().top ?? 0;
      const height = formRef.value?.getBoundingClientRect().height ?? 0;
      const fix = formTop < -(height + 16); // 16px is m-4
      fixToTop.value = fix;
      if (fix) {
        placeholderRef.value?.style.setProperty("height", `${height}px`);
      } else {
        placeholderRef.value?.style.removeProperty("height");
      }
    }),
  );
  return (
    <>
      <div ref={placeholderRef} class="my-4" />
      <form
        ref={formRef}
        preventdefault:submit
        onSubmit$={() => {
          if (query.value.length > 0) {
            isLoading.value = true;
            nav(`/search/${query.value}`).finally(() => {
              isLoading.value = false;
            });
          } else {
            nav("/");
          }
        }}
        class={`search-form ${fixToTop.value ? "search-form-fixed" : ""}`}
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
