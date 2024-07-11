import { component$, useSignal } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import Spinner from "./spinner";
export const SearchBar = component$<{ value?: string }>(({ value }) => {
  const nav = useNavigate();
  const query = useSignal(value ?? "");
  const isLoading = useSignal(false);
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
