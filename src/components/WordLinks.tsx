import { removeNumbersInWord } from "#helpers/string";
import type { Signal } from "@builder.io/qwik";
import { component$, useSignal } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { flattenVerb } from "~/helpers/redirect";
import { convertToRoman } from "~/helpers/roman";
import { LinkR } from "./linkWithRedirect";

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

export const WordLink = component$<{ word: Word | string }>(({ word }) => {
  return (
    <>
      <LinkR
        href={`/search/${cleanWordFromRom(removeNumbersInWord(toKey(word)))}`}
      >
        {flattenVerb(
          removeNumbersInWord(
            putTheNumbersAtTheEndAsRomanToTheBeginning(toKey(word)),
          ),
        )}
      </LinkR>
      {typeof word !== "string" && word.recursive && (
        <>
          {" "}
          (<WordLink word={{ word: word.recursive }} />)
        </>
      )}
    </>
  );
});

function toKey(word: Word | string): string {
  return typeof word === "string" ? word : word.word;
}

const ShowMoreOrLess = component$<{ showMore: Signal<boolean> }>(
  ({ showMore }) => (
    <div class="result-description">
      <Link
        onClick$={() => (showMore.value = !showMore.value)}
        class="cursor-pointer !bg-transparent font-bold"
        preventdefault:click
      >
        {showMore.value ? "«" : "»"} Daha {showMore.value ? "az" : "fazla"}{" "}
        göster
      </Link>
    </div>
  ),
);

export const WordLinks = component$<{
  words: Word[] | string[] | undefined;
  more?: Word[] | string[] | undefined;
  joinWith?: string;
}>(({ words, more, joinWith }) => {
  const showMore = useSignal(false);
  return (
    <>
      {// if showMore then join words and more, else just words
      words?.map((word, index) => (
        <span key={toKey(word)} class="result-description">
          <WordLink word={word} />
          {index < words.length - 1 && (joinWith ?? ", ")}
        </span>
      ))}

      {!!more?.length && (
        <>
          {showMore.value ? (
            <>
              <br />
              <ShowMoreOrLess showMore={showMore} />{" "}
              {more.map((word, index) => (
                <span key={toKey(word)} class="result-description">
                  <WordLink word={word} />
                  {index < more.length - 1 && (joinWith ?? ", ")}
                </span>
              ))}
            </>
          ) : (
            <ShowMoreOrLess showMore={showMore} />
          )}
        </>
      )}
    </>
  );
});
