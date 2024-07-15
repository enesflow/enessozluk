import type { LuggatPackage } from "#/luggat";
import { fetchAPI } from "#helpers/cache";
import { API_FAILED_TEXT, NO_RESULT } from "#helpers/constants";
import { convertToRoman } from "#helpers/roman";
import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { TextWithLinks } from "../textwithlinks";

const LUGGAT_URL = "https://www.luggat.com/" as const;
const LUGGAT_LINK_REGEX = /\(Bak[:.] (.+?)\)/g;

// eslint-disable-next-line qwik/loader-location
export const useLuggatLoader = routeLoader$<LuggatPackage>(
  async ({ params }) => {
    // VERSION 2
    try {
      const url = `${LUGGAT_URL}${params.query.toLocaleLowerCase("tr")}`;
      const { data } = await fetchAPI(url, {
        provider: "luggat",
      });
      // the data is already parsed with parseLuggat
      return data;
    } catch (error) {
      console.error("LUGGAT FAILED", error);
      return {
        isUnsuccessful: true,
        serverDefinedErrorText: API_FAILED_TEXT,
      };
    }
  },
);

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
