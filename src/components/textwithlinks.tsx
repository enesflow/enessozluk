import { component$ } from "@builder.io/qwik";
import { removeNumbersInWord } from "~/helpers/string";
import { WordLink } from "./WordLinks";

function isALetter(
  word: string | undefined,
  char: string | undefined,
): boolean {
  return !(
    // a comma
    (
      char === "," ||
      // a dot
      char === "." ||
      // a colon
      char === ":" ||
      // a semicolon
      char === ";" ||
      // a question mark
      char === "?" ||
      // a closing paren
      (char === ")" && !word?.includes("("))
    )
  );
}

export const TextWithLinks = component$<{
  text: string;
  regex: RegExp;
  makeWordLowercase?: boolean;
}>(({ text, regex, makeWordLowercase }) => {
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        // If the part contains a space, it is likely a link; otherwise, it's text
        // const [word, ...rest] = part.split(" ");
        const splitted = part.split(" ");
        const word = makeWordLowercase
          ? splitted[0].toLocaleLowerCase("tr")
          : splitted[0];
        const remainingText = splitted.slice(1).join(" ");

        if (index === 0) {
          // First part is always plain text
          return <span key={index} dangerouslySetInnerHTML={part} />;
        }

        return (
          <span key={index}>
            <>
              {/*  <LinkR
                href={`/search/${!isALetter(word, word[word.length - 1]) ? word.slice(0, -1) : word}`}
              >
                {flattenVerb(removeNumbersInWord(
                  !isALetter(word, word[word.length - 1]) ? word.slice(0, -1) : word,
                ))}
              </LinkR> */}
              <WordLink word={word} />
              {!isALetter(word, word[word.length - 1]) ? (
                <>{removeNumbersInWord(word[word.length - 1])}</>
              ) : (
                <></>
              )}{" "}
            </>

            {remainingText && <span dangerouslySetInnerHTML={remainingText} />}
          </span>
        );
      })}
    </>
  );
});
