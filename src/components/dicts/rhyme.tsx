import type { Signal } from "@builder.io/qwik";
import { component$ } from "@builder.io/qwik";
import type { RhymePackage } from "~/types/rhyme";
import { WordLink } from "../WordLinks";

export const RhymeView = component$<{
  data: Signal<RhymePackage>;
}>(({ data }) => {
  return (
    <>
      {"serverDefinedError" in data.value ? (
        <>
          <p class="error-message">{data.value.serverDefinedError}</p>
        </>
      ) : (
        <>
          {data.value.items.map((word, index) => (
            <span key={word} class="result-description">
              <WordLink word={{ word }} />

              {index < (data.value as any).items.length - 1 && ", "}
            </span>
          ))}
        </>
      )}
    </>
  );
});
