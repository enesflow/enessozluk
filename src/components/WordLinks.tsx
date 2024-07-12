import { removeNumbersAtEnd } from "#helpers/string";
import { component$, useComputed$, useSignal } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { putTheNumbersAtTheEndAsRomanToTheBeginning } from "./dicts/nisanyan";

export const WordLinks = component$<{ words: string[]; more?: string[] }>(
  ({ words, more }) => {
    const showMore = useSignal(false);
    const entries = useComputed$(() => {
      if (more && showMore.value) {
        return words.concat(more);
      }
      return words;
    });
    return (
      <>
        {
          // if showMore then join words and more, else just words
          entries.value.map((word, index) => (
            <span key={word} class="result-description">
              <Link href={`/search/${removeNumbersAtEnd(word)}`}>
                {putTheNumbersAtTheEndAsRomanToTheBeginning(word)}
              </Link>
              {index < entries.value.length - 1 && ", "}
            </span>
          ))
        }
        {more && (
          <div class="result-description">
            <Link
              onClick$={() => (showMore.value = !showMore.value)}
              class="cursor-pointer"
            >
              {showMore.value ? "«" : "»"} Daha{" "}
              {showMore.value ? "az" : "fazla"} göster
            </Link>
          </div>
        )}
      </>
    );
  },
);
