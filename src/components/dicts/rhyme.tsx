import type { Signal } from "@builder.io/qwik";
import { component$ } from "@builder.io/qwik";
import type { RhymePackage } from "~/types/rhyme";
import { WordLinks } from "../WordLinks";

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
        <div class="pb-4">
          <p class="result-title-took">75.000'den fazla kelime arasında</p>
          <WordLinks words={data.value.items} more={data.value.more} />
        </div>
      )}
    </>
  );
});
