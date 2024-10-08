import type { LuggatPackage, LuggatResponseError } from "#/luggat";
import { NO_RESULT } from "#helpers/constants";
import { romanOptional } from "#helpers/roman";
import { component$ } from "@builder.io/qwik";
import { TextWithLinks } from "../textwithlinks";

const LUGGAT_LINK_REGEX = /\(Bak[:.] (.+?)\)/g;

export function isLuggatFailed(
  data: LuggatPackage,
): data is LuggatResponseError {
  return data.isUnsuccessful;
}

export const LuggatView = component$<{
  data: LuggatPackage;
}>(({ data }) => {
  return (
    <>
      {isLuggatFailed(data) ? (
        <p class="error-message">{data.serverDefinedErrorText ?? NO_RESULT}</p>
      ) : (
        <ul class="results-list">
          {data.words.map((word, index) => (
            <li key={word.name} class="result-item">
              <h2 class="result-title">
                {romanOptional(index, data.words.length)}
                {word.name}
              </h2>
              <ul class="results-list">
                {word.definitions.map((meaning) => (
                  <li key={meaning} class="result-subitem">
                    <TextWithLinks
                      regex={LUGGAT_LINK_REGEX}
                      text={meaning}
                      makeWordLowercase
                    />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </>
  );
});
