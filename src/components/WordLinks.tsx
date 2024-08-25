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
import { flattenVerb } from "~/helpers/redirect";

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
  // Remove Roman numerals in parentheses from the start of the text
  return word.replace(/^\(\s*(?:[IVXLCDM]+)\s*\)\s*/, "").trim();
}

type Word = {
  word: string;
  recursive?: string;
};

type More = {
  title: string;
  words: Word[] | string[];
};

function toWords(words: string[] | Word[] | undefined): Word[] | undefined {
  if (!words) return;
  if (typeof words[0] === "string") {
    return (words as string[]).map((word) => ({ word }));
  }
  return words as Word[];
}

export const WordLink = component$<{ word: Word }>(({ word }) => {
  return (
    <>
      <LinkR
        href={`/search/${cleanWordFromRom(removeNumbersAtEnd(word.word))}`}
      >
        {flattenVerb(putTheNumbersAtTheEndAsRomanToTheBeginning(word.word))}
      </LinkR>
      {word.recursive && (
        <>
          {" "}
          (<WordLink word={{ word: word.recursive }} />)
        </>
      )}
    </>
  );
});

export const WordLinks = component$<{
  words: Word[] | string[] | undefined;
  more?: More[];
}>(({ words, more }) => {
  const loc = useLocation();
  const showMore = useSignal(false);
  const words_ = toWords(words);
  const entries = useComputed$(() => {
    showMore.value;
    // if you remove the random code above, you get error
    // Internal assert, this is likely caused by a bug in Qwik: resume: index is out of bounds
    if (more && showMore.value && words_) {
      return words_.concat(more.flatMap((m) => toWords(m.words) ?? []));
    }
    return words_ ?? [];
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
          <span key={word.word} class="result-description">
            {/* <LinkR
              href={`/search/${cleanWordFromRom(removeNumbersAtEnd(word.word))}`}
            >
              {flattenVerb(
                putTheNumbersAtTheEndAsRomanToTheBeginning(word.word),
              )}
            </LinkR> */}
            <WordLink word={word} />

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
