import type {
  NisanyanAffixPackage,
  NisanyanResponse,
  NisanyanResponseError,
  NisanyanWordPackage,
} from "#/nisanyan";
import {
  NisanyanAffixResponseErrorSchema,
  NisanyanAffixResponseSchema,
  NisanyanResponseErrorSchema,
  NisanyanResponseSchema,
} from "#/nisanyan";
import { API_FAILED_TEXT, NO_RESULT } from "#helpers/constants";
import {
  fetchAPI,
  loadCache,
  loadSharedMap,
  setSharedMapResult,
} from "#helpers/request";
import type { RequestEventBase } from "@builder.io/qwik-city";
import { routeLoader$, server$ } from "@builder.io/qwik-city";
import { removeNumbersInWord } from "~/helpers/string";
import { fullyCleanWord } from "~/routes/plugin";
import type { NisanyanWord } from "~/types/nisanyan";
import { debugAPI } from "../log";
import { to } from "../to";
import { buildNisanyanAffixUrl, buildNisanyanUrl } from "./url";
import { flattenVerb } from "../redirect";

function isWord(query: string): boolean {
  return !(query.startsWith("+") || removeNumbersInWord(query).endsWith("+"));
}

function buildNisanyanAPIError(
  e: RequestEventBase,
  url: string,
  title: string,
): NisanyanResponseError {
  debugAPI(e, `Nisanyan API Error: ${title}`);
  const { query } = loadSharedMap(e);
  return {
    url,
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
        name: query.rawDecoded,
      },
    ],
  };
}

//The function below is written by chatgpt, I couldn't check it. I will revert it in case of an error.
function fixForJoinedWords(data: NisanyanWordPackage): NisanyanWordPackage {
  if (data.isUnsuccessful) return data;
  if (!data.words) return data;

  for (let wordIndex = 0; wordIndex < data.words.length; wordIndex++) {
    const word = data.words[wordIndex];
    if (!word.etymologies) continue;

    let detected = false;
    let detectedTemp = false;
    let lastPlusIndex = -1;
    let isIn = false;

    for (let etmIndex = 0; etmIndex < word.etymologies.length; etmIndex++) {
      const etm = word.etymologies[etmIndex];
      // Set serverDefinedMoreIndentation for relations with abbreviation "≈"
      if (etm.relation.abbreviation === "≈") {
        data.words[wordIndex].etymologies![
          etmIndex
        ].serverDefinedMoreIndentation = true;
      }
      if (etm.paranthesis === "(") isIn = true;
      if (isIn || etm.paranthesis === "()")
        data.words[wordIndex].etymologies![
          etmIndex
        ].serverDefinedMoreIndentation = true;
      if (etm.paranthesis === ")") isIn = false;

      if (detected) {
        // Mark the end of the joined word if the relation abbreviation is not "+" or "§"
        if (
          etm.relation.abbreviation !== "+" &&
          etm.relation.abbreviation !== "§" &&
          detectedTemp
        ) {
          detectedTemp = false;
          data.words[wordIndex].etymologies![
            etmIndex - 1
          ].serverDefinedEndOfJoin = true;
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

      // Track the index of the last "+" abbreviation
      if (etm.relation.abbreviation === "+") {
        lastPlusIndex = etmIndex;
      }
    }

    // Set serverDefinedEndOfJoin for the last "+" abbreviation
    if (lastPlusIndex !== -1) {
      data.words[wordIndex].etymologies![lastPlusIndex].serverDefinedEndOfJoin =
        true;
    }
  }

  return data;
}

async function cleanseNisanyanResponse(
  e: RequestEventBase,
  data: NisanyanResponse,
): Promise<NisanyanWordPackage> {
  const sharedMap = loadSharedMap(e);
  const mapper = (word: any & { name: string }) => ({
    ...word,
    name: removeNumbersInWord(word.name),
  });
  data.words = data.words?.map(mapper);
  data.fiveAfter = data.fiveAfter?.map(mapper);
  data.fiveBefore = data.fiveBefore?.map(mapper);
  data.randomWord = mapper(data.randomWord);

  data.words?.forEach((word) => {
    word.name = flattenVerb(word.name);
    if (fullyCleanWord(word.name) !== sharedMap.query.noNumPlusParenAccL) {
      console.log(word.name, "is not", sharedMap.query.rawDecoded);
      word.serverDefinedTitleDescription = sharedMap.query.rawDecodedL;
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
    const [error, response] = await to(fetchAPI(url.api));
    // Returns error if request failed
    if (error || !response?.success) {
      if (response?.code && Math.floor(response.code / 100) === 4) {
        return setSharedMapResult(e, "nisanyan", {
          url: url.user,
          serverDefinedErrorText: NO_RESULT,
          isUnsuccessful: true,
        });
      } else {
        return buildNisanyanAPIError(
          e,
          url.user,
          `${API_FAILED_TEXT}: ${error?.message || response?.code}`,
        );
      }
    }
    response.data = {
      ...response.data,
      url: url.user,
    };
    const parsed = NisanyanResponseSchema.safeParse(response.data);
    // Error handling
    {
      // Returns recommendations if the response is an error or has no results
      const error = NisanyanResponseErrorSchema.safeParse(response.data);
      if (error.success) {
        return setSharedMapResult(e, "nisanyan", error.data);
      }
      // Returns error if parsing failed
      if (!parsed.success) {
        return buildNisanyanAPIError(
          e,
          url.user,
          `${API_FAILED_TEXT}: ${parsed.error.message}`,
        );
      }
    } /////////////////////////////
    const data = await cleanseNisanyanResponse(e, parsed.data);
    return setSharedMapResult(e, "nisanyan", data);
  },
);

function cleanseNisanyanAffixResponse(
  e: RequestEventBase,
  url: string,
  data: NisanyanAffixPackage,
): NisanyanWordPackage {
  const words = ((data: any): NisanyanWord[] => {
    //get all the keys
    const keys = Object.keys(data);
    let result = [] as any;
    for (const key of keys) {
      if (key.toLocaleLowerCase().endsWith("words")) {
        result = result.concat(data[key]);
      }
    }
    return result;
  })(data);
  if ("affix" in data)
    return {
      url,
      isUnsuccessful: false,
      serverDefinedIsGeneratedFromAffix: true,
      words: [
        {
          serverDefinedTitleDescription: words.length
            ? `${words.length} kelime`
            : undefined,
          _id: data.affix._id,
          actualTimeUpdated: data.affix.timeUpdated,
          etymologies: [],
          id_depr: data.affix.id_depr,
          name: data.affix.name,
          note: data.affix.description,
          queries: [],
          references: [],
          referenceOf: words.map((word) => ({
            ...word,
            similarWords: [],
            histories: [],
            referenceOf: [],
            misspellings: [],
          })),
          timeCreated: data.affix.timeCreated,
          timeUpdated: data.affix.timeUpdated,
        },
      ],
    };
  else {
    return buildNisanyanAPIError(e, url, "Invalid query");
  }
}

// This returns NisanyanWordPackage instead of NisanyanAffixPackage
//  because we don't want to rewrite the frontend to handle affixes
const loadNisanyanAffix = server$(
  async function (): Promise<NisanyanWordPackage> {
    const e = this;
    // If there is data in cache, return it
    {
      const cache = loadCache(e, "nisanyan-affix");
      if (cache) return setSharedMapResult(e, "nisanyan-affix", cache);
    } /////////////////////////////
    const url = buildNisanyanAffixUrl(e);
    const [error, response] = await to(fetchAPI(url.api));
    // Returns error if request failed
    if (error || !response?.success) {
      try {
        return loadNisanyanWord.call(e);
      } catch (error) {
        return buildNisanyanAPIError(
          e,
          url.user,
          `${API_FAILED_TEXT}: ${(error as Error | undefined)?.message || response?.code}`,
        );
      }
    }
    const parsed = NisanyanAffixResponseSchema.safeParse(response.data);
    // Error handling
    {
      // Returns recommendations if the response is an error or has no results
      const error = NisanyanAffixResponseErrorSchema.safeParse(response.data);
      if (error.success) {
        return buildNisanyanAPIError(e, url.user, NO_RESULT);
      }
      // Returns error if parsing failed
      if (!parsed.success) {
        return buildNisanyanAPIError(
          e,
          url.user,
          `${API_FAILED_TEXT}: ${parsed.error.message}`,
        );
      }
    } /////////////////////////////
    const data = cleanseNisanyanAffixResponse(e, url.user, parsed.data);
    return setSharedMapResult(e, "nisanyan-affix", data);
  },
);

// eslint-disable-next-line qwik/loader-location
export const useNisanyanLoader = routeLoader$<NisanyanWordPackage>(
  async (e) => {
    const sharedMap = loadSharedMap(e);
    if (isWord(sharedMap.query.rawDecoded)) {
      return loadNisanyanWord.call(e);
    } else {
      return loadNisanyanAffix.call(e);
    }
  },
);
