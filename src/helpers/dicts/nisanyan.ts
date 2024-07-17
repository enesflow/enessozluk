import type {
  NisanyanResponse,
  NisanyanResponseError,
  NisanyanWordPackage,
} from "#/nisanyan";
import {
  NisanyanResponseErrorSchema,
  NisanyanResponseSchema,
} from "#/nisanyan";
import { API_FAILED_TEXT } from "#helpers/constants";
import {
  fetchAPI,
  loadCache,
  loadSharedMap,
  setSharedMapResult,
} from "#helpers/request";
import type { RequestEventBase } from "@builder.io/qwik-city";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import { DID_YOU_MEAN } from "~/helpers/constants";
import { flattenVerb } from "~/helpers/redirect";
import { removeNumbersInWord } from "~/helpers/string";
import { debugAPI } from "../log";
import { to } from "../to";
import { buildNisanyanUrl } from "./url";

function isWord(query: string): boolean {
  return !(query.startsWith("+") || removeNumbersInWord(query).endsWith("+"));
}

function buildNisanyanAPIError(
  e: RequestEventBase,
  title: string,
): NisanyanResponseError {
  debugAPI(e, `Nisanyan API Error: ${title}`);
  const { query } = loadSharedMap(e);
  return {
    serverDefinedErrorText: API_FAILED_TEXT,
    isUnsuccessful: true,
    words: [
      {
        _id: "1",
        name: "Tekrar",
      },
      {
        _id: "2",
        name: "dene-",
      },
      {
        _id: "3",
        name: query,
      },
    ],
  };
}

function fixForJoinedWords(data: NisanyanWordPackage): NisanyanWordPackage {
  if (data.isUnsuccessful) return data;
  if (!data.words) return data;
  for (let wordIndex = 0; wordIndex < data.words.length; wordIndex++) {
    const word = data.words[wordIndex];
    if (!word.etymologies) continue;
    let detected = false;
    let finished = false;
    let detectedTemp = false;
    for (let etmIndex = 0; etmIndex < word.etymologies.length; etmIndex++) {
      const etm = word.etymologies[etmIndex];
      if (detected) {
        if (finished) {
          data.words[wordIndex].etymologies![
            etmIndex
          ].serverDefinedMoreIndentation = true;
        }
        if (etm.relation.abbreviation === "+") {
          finished = true;
        }
        if (
          !(
            etm.relation.abbreviation === "+" ||
            etm.relation.abbreviation === "§"
          )
        ) {
          data.words[wordIndex].etymologies![
            etmIndex
          ].serverDefinedMoreIndentation = true;
        }
      } else {
        if (
          etm.relation.abbreviation === "+" ||
          etm.relation.abbreviation === "§"
        ) {
          detected = true;
          detectedTemp = true;
        }
      }

      if (
        !(
          etm.relation.abbreviation === "+" || etm.relation.abbreviation === "§"
        ) &&
        detectedTemp
      ) {
        detectedTemp = false;
        data.words[wordIndex].etymologies![
          etmIndex - 1
        ].serverDefinedEndOfJoin = true;
      }
    }
    // make the last one serverDefinedEndOfJoin if the abbreviation is +

    if (data.words[wordIndex].etymologies) {
      const len = data.words[wordIndex].etymologies!.length;
      if (
        data.words[wordIndex].etymologies![len - 1].relation.abbreviation == "+"
      ) {
        data.words[wordIndex].etymologies![len - 1].serverDefinedEndOfJoin =
          true;
      }
    }
  }
  return data;
}

function cleanseNisanyanResponse(
  data: NisanyanResponse,
  query: string,
): NisanyanWordPackage {
  const mapper = (word: any & { name: string }) => ({
    ...word,
    name: removeNumbersInWord(word.name),
  });
  data.words = data.words?.map(mapper);
  const misspellings = data.words?.map((i) => i.misspellings).flat();
  // if our word is a misspelling, we should return error
  if (misspellings?.includes(query)) {
    return {
      serverDefinedErrorText: DID_YOU_MEAN,
      isUnsuccessful: true,
      words:
        data.words?.map((i) => ({
          _id: i._id,
          name: i.name,
        })) ?? [],
    };
  }
  data.fiveAfter = data.fiveAfter.map(mapper);
  data.fiveBefore = data.fiveBefore.map(mapper);
  data.randomWord = mapper(data.randomWord);

  data.words?.forEach((word) => {
    if (
      word.name.toLocaleLowerCase("tr") !== query.toLocaleLowerCase("tr") &&
      flattenVerb(word.name) !== query
    ) {
      word.serverDefinedTitleDescription = query;
      word.serverDefinedIsMisspelling = true;
    }
  });

  return fixForJoinedWords(data);
}

const loadNisanyanWord = server$(
  async function (): Promise<NisanyanWordPackage> {
    const e = this;
    // If there is data in cache, return it
    {
      const cache = loadCache(e, "nisanyan");
      if (cache) return setSharedMapResult(e, "nisanyan", cache);
    } /////////////////////////////
    const url = buildNisanyanUrl(e);
    const [error, response] = await to(fetchAPI(url));
    // Returns error if request failed
    if (error) {
      return buildNisanyanAPIError(e, `${API_FAILED_TEXT}: ${error.message}`);
    }
    const parsed = NisanyanResponseSchema.safeParse(response);
    // Error handling
    {
      // Returns recommendations if the response is an error or has no results
      const error = NisanyanResponseErrorSchema.safeParse(response);
      if (error.success) {
        return setSharedMapResult(e, "nisanyan", error.data);
      }
      // Returns error if parsing failed
      if (!parsed.success) {
        return buildNisanyanAPIError(
          e,
          `${API_FAILED_TEXT}: ${parsed.error.message}`,
        );
      }
    } /////////////////////////////
    const data = cleanseNisanyanResponse(parsed.data, e.params.query);
    return setSharedMapResult(e, "nisanyan", data);
  },
);

// eslint-disable-next-line qwik/loader-location
export const useNisanyanLoader = routeLoader$<NisanyanWordPackage>(
  async (e) => {
    if (isWord(e.params.query)) {
      return loadNisanyanWord.call(e);
    } else {
      return buildNisanyanAPIError(e, "Invalid query");
    }
  },
);
