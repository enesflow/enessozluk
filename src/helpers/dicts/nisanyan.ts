import type {
  NisanyanAffixPackage,
  NisanyanPackage,
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
import { DID_YOU_MEAN } from "~/helpers/constants";
import { flattenVerb } from "~/helpers/redirect";
import { removeNumbersInWord } from "~/helpers/string";
import type { NisanyanWord } from "~/types/nisanyan";
import { debugAPI } from "../log";
import { to } from "../to";
import { buildNisanyanAffixUrl, buildNisanyanUrl } from "./url";

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

function cleanseNisanyanAffixResponse(
  e: RequestEventBase,
  data: NisanyanAffixPackage,
): NisanyanAffixPackage {
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
      affix: data.affix,
      isUnsuccessful: false,
      words: [
        {
          serverDefinedTitleDescription: `${words.length} kelime`,
          _id: data.affix._id,
          name: data.affix.name,
          note: data.affix.note,
          referenceOf: data.words?.map((word) => ({
            _id: word._id,
            name: word.name,
            histories: word.histories,
          })),
        },
      ],
    };
  else {
    return buildNisanyanAPIError(e, "Invalid query");
  }
}

const loadNisanyanAffix = server$(
  async function (): Promise<NisanyanAffixPackage> {
    const e = this;
    // If there is data in cache, return it
    {
      const cache = loadCache(e, "nisanyan-affix");
      if (cache) return setSharedMapResult(e, "nisanyan-affix", cache);
    } /////////////////////////////
    const url = buildNisanyanAffixUrl(e);
    const [error, response] = await to(fetchAPI(url));
    // Returns error if request failed
    if (error) {
      return buildNisanyanAPIError(e, `${API_FAILED_TEXT}: ${error.message}`);
    }
    const parsed = NisanyanAffixResponseSchema.safeParse(response);
    /* console.log(JSON.stringify(parsed.error, null, 2));

    console.log(response);
    return buildNisanyanAPIError(e, "debug"); */
    // Error handling
    {
      // Returns recommendations if the response is an error or has no results
      const error = NisanyanAffixResponseErrorSchema.safeParse(response);
      if (error.success) {
        return buildNisanyanAPIError(e, NO_RESULT);
      }
      // Returns error if parsing failed
      if (!parsed.success) {
        return buildNisanyanAPIError(
          e,
          `${API_FAILED_TEXT}: ${parsed.error.message}`,
        );
      }
    } /////////////////////////////
    const data = cleanseNisanyanAffixResponse(e, parsed.data);
    return setSharedMapResult(e, "nisanyan-affix", data);
  },
);

// eslint-disable-next-line qwik/loader-location
export const useNisanyanLoader = routeLoader$<NisanyanPackage>(async (e) => {
  if (isWord(e.params.query)) {
    return loadNisanyanWord.call(e);
  } else {
    return loadNisanyanAffix.call(e);
  }
});
