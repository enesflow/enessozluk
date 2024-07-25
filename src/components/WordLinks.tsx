import { removeNumbersAtEnd } from "#helpers/string";
import {
  component$,
  useComputed$,
  useSignal,
  useTask$,
} from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import { LinkR } from "./linkWithRedirect";
import { convertToRoman } from "~/helpers/roman";

export function putTheNumbersAtTheEndAsRomanToTheBeginning(
  text: string,
): string {
  // example: a1 -> (I) a
  const match = text.match(/(\d+)$/);
  if (match) {
    const number = match[1];
    const romanNumber = convertToRoman(parseInt(number));
    return `(${romanNumber}) ${text.replace(number, "").trim()}`;
  }
  return text;
}

function cleanWordFromRom(word: string): string {
  // remove any text in parenthesis (with the parenthesis)
  return word.replace(/\(.*\)/, "").trim();
}

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
            <LinkR
              href={`/search/${cleanWordFromRom(removeNumbersAtEnd(word))}`}
            >
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
