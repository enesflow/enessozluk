import type { LuggatResponse, LuggatResponseError } from "#/luggat";
import { convertToRoman } from "#helpers/roman";
import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { load } from "cheerio";
import { TextWithLinks } from "../textwithlinks";
import { API_FAILED_TEXT } from "#helpers/constants";

const LUGGAT_URL = "https://www.luggat.com/" as const;
const LUGGAT_NO_RESULT = "Sonuç bulunamadı" as const;
const LUGGAT_LINK_REGEX = /\(Bak[:.] (.+?)\)/g;

function consolidateNames(names: string): string {
  // example:
  // input: kudsi / kudsi / kudsî / قُدْس۪ي
  // output: kudsi / kudsî / قُدْس۪ي
  const namesSet = new Set<string>();
  const namesArray = names.split("/");
  for (const name of namesArray) {
    if (name.trim() === "") {
      continue;
    }
    namesSet.add(name.trim());
  }
  return Array.from(namesSet).join(" / ");
}

function consolidateDefinitions(definitions: string[]): string[] {
  const definitionsSet = new Set<string>();
  for (const definition of definitions) {
    definitionsSet.add(definition.trim());
  }
  return Array.from(definitionsSet);
}

function consolidateEntries(
  words: LuggatResponse["words"],
): LuggatResponse["words"] {
  const resultRecord = new Map<string, string[]>();
  for (const word of words) {
    if (resultRecord.has(word.name)) {
      resultRecord.set(word.name, [
        ...resultRecord.get(word.name)!,
        ...word.definitions,
      ]);
    } else {
      resultRecord.set(word.name, word.definitions);
    }
  }
  const result: LuggatResponse["words"] = [];
  for (const [name, definitions] of resultRecord) {
    result.push({
      name: consolidateNames(name),
      definitions: consolidateDefinitions(definitions),
    });
  }
  return result;
}

// eslint-disable-next-line qwik/loader-location
export const useLuggatLoader = routeLoader$<
  LuggatResponse | LuggatResponseError
>(async ({ params }) => {
  try {
    const url = `${LUGGAT_URL}${params.query}`;
    const response = await fetch(url);
    const html = await response.text();
    const $ = load(html);
    const words: LuggatResponse["words"] = [];

    $(".arama-sonucu-div").each((index, element) => {
      const name = $(element)
        .find("h2.heading-5")
        .text()
        .trim()
        .replace(/\s+/g, " ");
      const definitions: string[] = [];

      // Process definitions inside <ol> lists
      $(element)
        .find("ol li")
        .each((_, li) => {
          const definition = $(li).text().trim();
          definitions.push(definition);
        });

      // If no <ol> list definitions found, check for other possible definitions
      if (definitions.length === 0) {
        const potentialDefinition = $(element)
          .contents()
          .filter((_, node) => node.type === "text")
          .text()
          .trim();
        if (potentialDefinition) {
          definitions.push(potentialDefinition);
        }
      }

      if (name && definitions.length) {
        words.push({ name, definitions });
      }
    });
    if (words.length === 0) {
      return { isUnsuccessful: true };
    }

    return {
      isUnsuccessful: false,
      words: consolidateEntries(words),
    };
  } catch (error) {
    return {
      isUnsuccessful: true,
      serverDefinedErrorText: API_FAILED_TEXT,
    };
  }
});

export const LuggatView = component$<{
  data: LuggatResponse | LuggatResponseError;
}>(({ data }) => {
  return (
    <>
      {data.isUnsuccessful ? (
        <p class="error-message">
          {data.serverDefinedErrorText ?? LUGGAT_NO_RESULT}
        </p>
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
