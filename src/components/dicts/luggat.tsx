import type { LuggatPackage } from "#/luggat";
import { NO_RESULT } from "#helpers/constants";
import { convertToRoman } from "#helpers/roman";
import { component$ } from "@builder.io/qwik";
import { TextWithLinks } from "../textwithlinks";

const LUGGAT_LINK_REGEX = /\(Bak[:.] (.+?)\)/g;

export const LuggatView = component$<{
  data: LuggatPackage;
}>(({ data }) => {
  return (
    <>
      {data.isUnsuccessful ? (
        <p class="error-message">{data.serverDefinedErrorText ?? NO_RESULT}</p>
      ) : (
        <ul class="results-list">
          {data.words.map((word, index) => (
            <li key={word.name} class="result-item">
              <h2 class="result-title">
                ({convertToRoman(index + 1)}) {word.name}
              </h2>
              <ul class="results-list">
                {word.definitions.map((meaning) => (
                  <li key={meaning} class="result-subitem">
                    <TextWithLinks regex={LUGGAT_LINK_REGEX} text={meaning} />
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
