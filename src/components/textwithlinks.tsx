import { component$ } from "@builder.io/qwik";
import { LinkR } from "./linkWithRedirect";
import { removeNumbersInWord } from "~/helpers/string";

function isALetter(char: string | undefined): boolean {
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
      char === "?"
    )
  );
}

export const TextWithLinks = component$<{
  text: string;
  regex: RegExp;
}>(({ text, regex }) => {
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        // If the part contains a space, it is likely a link; otherwise, it's text
        const [word, ...rest] = part.split(" ");
        //const word = removeNumbersInWord(rawWord);
        const remainingText = rest.join(" ");

        if (index === 0) {
          // First part is always plain text
          return <span key={index} dangerouslySetInnerHTML={part} />;
        }

        return (
          <span key={index}>
            <>
              <LinkR
                href={`/search/${!isALetter(word[word.length - 1]) ? word.slice(0, -1) : word}`}
              >
                {removeNumbersInWord(
                  !isALetter(word[word.length - 1]) ? word.slice(0, -1) : word,
                )}
              </LinkR>
              {!isALetter(word[word.length - 1]) ? (
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
