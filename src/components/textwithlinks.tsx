import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

function isALetter(char: string | undefined): boolean {
  return char?.toLowerCase() !== char?.toUpperCase();
}

export const TextWithLinks = component$<{
  text: string;
  regex: RegExp;
  class?: string;
}>(({ text, regex, class: className }) => {
  const parts = text.split(regex);

  return (
    <p class={className}>
      {parts.map((part, index) => {
        // If the part contains a space, it is likely a link; otherwise, it's text
        const [word, ...rest] = part.split(" ");
        const remainingText = rest.join(" ");

        if (index === 0) {
          // First part is always plain text
          return <span key={index} dangerouslySetInnerHTML={part} />;
        }

        return (
          <span key={index}>
            <>
              <Link
                href={`/search/${!isALetter(word[word.length - 1]) ? word.slice(0, -1) : word}`}
                dangerouslySetInnerHTML={
                  !isALetter(word[word.length - 1]) ? word.slice(0, -1) : word
                }
              />

              {!isALetter(word[word.length - 1]) ? (
                <>{word[word.length - 1]} </>
              ) : (
                <></>
              )}
            </>

            {remainingText && <span dangerouslySetInnerHTML={remainingText} />}
          </span>
        );
      })}
    </p>
  );
});
