import { removeNumbersAtEnd } from "#helpers/string";
import {
  component$,
  useComputed$,
  useSignal,
  useTask$,
} from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import { putTheNumbersAtTheEndAsRomanToTheBeginning } from "./dicts/nisanyan";
import { LinkR } from "./linkWithRedirect";

export const WordLinks = component$<{
  words: string[] | undefined;
  more?: string[];
}>(({ words, more }) => {
  const loc = useLocation();
  const showMore = useSignal(false);
  const entries = useComputed$(() => {
    showMore.value;
    // if you remove the random code above, you get error
    // Internal assert, this is likely caused by a bug in Qwik: resume: index is out of bounds

    if (more && showMore.value && words) {
      return words.concat(more);
    }
    return words ?? [];
  });
  useTask$(({ track }) => {
    track(() => loc.isNavigating);
    if (!loc.isNavigating) showMore.value = false;
  });
  return (
    <>
      {
        // if showMore then join words and more, else just words
        entries.value.map((word, index) => (
          <span key={word} class="result-description">
            <LinkR href={`/search/${removeNumbersAtEnd(word)}`}>
              {putTheNumbersAtTheEndAsRomanToTheBeginning(word)}
            </LinkR>
            {index < entries.value.length - 1 && ", "}
          </span>
        ))
      }
      {!!more?.length && (
        <div class="result-description">
          <Link
            onClick$={() => (showMore.value = !showMore.value)}
            class="cursor-pointer font-bold"
            preventdefault:click
          >
            {showMore.value ? "«" : "»"} Daha {showMore.value ? "az" : "fazla"}{" "}
            göster
          </Link>
        </div>
      )}
    </>
  );
});
