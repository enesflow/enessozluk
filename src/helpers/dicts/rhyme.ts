import { loadCache, loadSharedMap, setSharedMapResult } from "#helpers/request";
import type { RequestEventBase } from "@builder.io/qwik-city";
import { routeLoader$ } from "@builder.io/qwik-city";
import { DEV_DISABLED } from "~/routes/search/[query]";
import type { RhymeErrorResponse, RhymePackage } from "~/types/rhyme";
import { RHYME_VERSION } from "~/types/rhyme";
import { NO_RESULT } from "../constants";
import { words } from "../data/words";
import { debugAPI } from "../log";
import { perf } from "../time";

function buildRhymeAPIError(
  e: RequestEventBase,
  word: string,
  title: string,
): RhymeErrorResponse {
  debugAPI(e, `Rhyme API Error: ${title}`);
  return {
    word,
    serverDefinedError: title,
    version: RHYME_VERSION,
    perf: perf(e),
  };
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
// eslint-disable-next-line qwik/loader-location
export const useRhymeLoader = routeLoader$<RhymePackage>(async (e) => {
  const sharedMap = loadSharedMap(e);
  const word = sharedMap.query.noNumPlusParenAccL;
  if (DEV_DISABLED.rhyme)
    return buildRhymeAPIError(e, word, "Rhyme is disabled");
  // If there is data in cache, return it
  {
    const cache = loadCache(e, "rhyme");
    if (cache) return setSharedMapResult(e, "rhyme", cache);
  } /////////////////////////////
  const word_reversed_clear = clear(word.split("").reverse().join(""));

  // binary search through the words array using word_reversed_clear to get the index
  let closest = -1;
  {
    let start = 0;
    let end = words.length - 1;
    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      const wordMid = clear(words[mid]);
      closest = mid;
      if (wordMid === word_reversed_clear) {
        // index = mid;
        break;
      } else if (wordMid < word_reversed_clear) {
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }
  }
  const data: RhymePackage = {
    word,
    version: RHYME_VERSION,
    perf: perf(e),
    items: [],
  };
  // if the word is not found, return an empty array
  if (closest === -1)
    return setSharedMapResult(e, "rhyme", {
      ...data,
      serverDefinedError: NO_RESULT,
    });

  // find -10 and +10 words from the index
  const normalCount = 20;
  const start = Math.max(0, closest - normalCount);
  const end = Math.min(words.length, closest + normalCount);
  // const rhyming_words = words.slice(start, index).concat(words.slice(index + 1, end)).map((w) => w.split("").reverse().join(""));
  const fromStart = words
    .slice(start, closest)
    .map((w) => w.split("").reverse().join(""))
    .reverse();
  const fromEnd = words
    .slice(closest + 1, end)
    .map((w) => w.split("").reverse().join(""));
  // make a new array with one from each array
  // like: [fromStart[0], fromEnd[0], fromStart[1], fromEnd[1], ...]
  const rhymingWords = Array.from(
    { length: Math.max(fromStart.length, fromEnd.length) },
    (_, i) => [fromStart[i], fromEnd[i]],
  )
    .flat()
    .filter(Boolean);
  return setSharedMapResult(e, "rhyme", {
    ...data,
    items: rhymingWords,
  });
});
