import {
  loadCache,
  loadSharedMap,
  setSharedMapResult,
  withoutCache,
} from "#helpers/request";
import type { RequestEventBase } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { DEV_DISABLED } from "~/routes/search/[query]/dev";
import type { RhymeErrorResponse, RhymePackage } from "~/types/rhyme";
import { RHYME_VERSION } from "~/types/rhyme";
import { NO_RESULT } from "../constants";
import { words } from "../data/words";
import { debugAPI } from "../log";
import { perf } from "../time";

const CUSTOM_ALPHABET = "hğaeıiylroöuübpdtçgkfvszşcjmn";

function smaller_char(a: string, b: string): boolean {
  const aIndex = CUSTOM_ALPHABET.indexOf(a);
  const bIndex = CUSTOM_ALPHABET.indexOf(b);
  return aIndex < bIndex;
}

function smaller(a: string, b: string): boolean {
  /* const aIndex = CUSTOM_ALPHABET.indexOf(a);
  const bIndex = CUSTOM_ALPHABET.indexOf(b);
  console.log("is smaller", a, b, aIndex, bIndex);
  return aIndex < bIndex; */
  // we are not comparing only characters but words
  // so we need to compare the whole word
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) {
      return smaller_char(a[i], b[i]);
    }
  }
  return a.length < b.length;
}

function buildRhymeAPIError(
  e: RequestEventBase,
  word: string,
  title: string,
): RhymeErrorResponse {
  debugAPI(e, `Rhyme API Error: ${title}`);
  return withoutCache(
    e,
    {
      word,
      serverDefinedError: title,
      version: RHYME_VERSION,
      perf: perf(e),
    },
    "rhyme",
  );
}

function clear(word: string): string {
  // replace all space and - with empty stringa
  // replace â with a and î with i
  // and û with u and ô with o
  // and their uppercase versions
  return word
    .replace(/[\s-]/g, "")
    .replace(/â/g, "a")
    .replace(/î/g, "i")
    .replace(/û/g, "u")
    .replace(/ô/g, "o")
    .replace(/Â/g, "A")
    .replace(/Î/g, "İ")
    .replace(/Û/g, "U")
    .replace(/Ô/g, "O");
}

function sortWordsByRhyme(det: string, words: string[]): string[] {
  function getPoints(reversed: string): number {
    let sum = 0;
    for (let i = 0; i < Math.min(reversed.length, det.length); i++) {
      const detChar = det[i];
      const char = reversed[i];
      const detIndex = CUSTOM_ALPHABET.indexOf(detChar);
      const index = CUSTOM_ALPHABET.indexOf(char);
      sum += Math.abs(detIndex - index);
    }
    return sum;
  }
  const reversedWord = clear(det).split("").reverse().join("");
  // sort by the "points" of the words
  // asc
  // for every word, reverse it, and for from the start up to the length of det
  // and add the points like abs(alphabetIndex - detAlphabetIndex)
  const points = words.map((word) => {
    const reversed = clear(word).split("").reverse().join("");
    // compare how many characters are same from the start
    let same = 0;
    for (let i = 0; i < Math.min(reversed.length, reversedWord.length); i++) {
      if (reversed[i] === reversedWord[i]) {
        same++;
      } else {
        break;
      }
    }
    return same;
  });
  const sorted = words.slice().sort((a, b) => {
    const indexA = words.indexOf(a);
    const indexB = words.indexOf(b);
    // if the points are the same, sort by getPoints
    if (points[indexA] === points[indexB]) {
      return (
        getPoints(clear(b).split("").reverse().join("")) -
        getPoints(clear(a).split("").reverse().join(""))
      );
    }
    return points[indexB] - points[indexA]; // desc
  });
  // print the best 5 words and their points
  /* console.log("Best 5 words:");
  for (let i = 0; i < Math.min(5, words.length); i++) {
    console.log(sorted[i], points[words.indexOf(sorted[i])]);
  }
  console.log("point of", "kontes"); */
  return sorted;
}

function getWords(
  array: string[],
  word: string,
  limit: number,
): string[] | null {
  const clearWord = clear(word);
  const word_reversed_clear = clearWord.split("").reverse().join("");

  // binary search through the words array using word_reversed_clear to get the index
  let closest = -1;
  let index = -1;
  {
    let start = 0;
    let end = array.length - 1;
    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      const wordMid = clear(array[mid]);
      closest = mid;
      if (wordMid === word_reversed_clear) {
        index = mid;
        break;
      } //else if (wordMid < word_reversed_clear) {
      else if (smaller(wordMid, word_reversed_clear)) {
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }
  }
  if (closest === -1) return null;

  const normalCount = limit;
  const maxCount = limit * 2;
  const start = Math.max(0, closest - maxCount);
  const end = Math.min(array.length, closest + maxCount);

  const result: string[] = [];

  // Collect words after the closest index
  for (let i = closest + 1; i < end && result.length < normalCount; i++) {
    const reversedWord = array[i].split("").reverse().join("");
    if (!reversedWord.endsWith(" " + clearWord)) {
      result.push(reversedWord);
    }
  }

  // If the exact word was not found, add the closest word
  if (index === -1) {
    result.push(array[closest].split("").reverse().join(""));
  }

  // Collect words before the closest index
  for (
    let i = closest - 1;
    i >= start && result.length < normalCount * 2;
    i--
  ) {
    const reversedWord = array[i].split("").reverse().join("");
    if (!reversedWord.endsWith(" " + clearWord)) {
      result.push(reversedWord);
    }
  }

  return sortWordsByRhyme(word, result);
}

// eslint-disable-next-line qwik/loader-location
export const useRhymeLoader = routeLoader$<RhymePackage>(async (e) => {
  const sharedMap = loadSharedMap(e);
  const word = sharedMap.query.noNumEtcParenAccL;
  if (DEV_DISABLED.rhyme)
    return buildRhymeAPIError(e, word, "Rhyme is disabled");
  // If there is data in cache, return it
  {
    const cache = loadCache(e, "rhyme");
    if (cache) return setSharedMapResult(e, "rhyme", cache);
  } /////////////////////////////

  const result = getWords(words, word, 100);

  const data: RhymePackage = {
    word,
    version: RHYME_VERSION,
    perf: perf(e),
    items: [],
  };
  // if the word is not found, return an empty array
  if (result === null)
    return setSharedMapResult(e, "rhyme", {
      ...data,
      serverDefinedError: NO_RESULT,
    });

  return setSharedMapResult(e, "rhyme", {
    ...data,
    items: result.slice(0, 20),
    more: result.length > 20 ? result.slice(20) : undefined,
  });
});
