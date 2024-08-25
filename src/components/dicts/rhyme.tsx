import { component$ } from "@builder.io/qwik";
import type { RhymePackage } from "~/types/rhyme";
import { WordLinks } from "../WordLinks";

export const RhymeView = component$<{
  data: RhymePackage;
}>(({ data }) => {
  return (
    <>
      {"serverDefinedError" in data ? (
        <>
          <p class="error-message">{data.serverDefinedError}</p>
        </>
      ) : (
        <>
          {" "}
          <WordLinks
            words={data.items}
            more={
              data.more_items
                ? [
                    {
                      title: "",
                      words: data.more_items,
                    },
                  ]
                : undefined
            }
          />
        </>
      )}
    </>
  );
});
