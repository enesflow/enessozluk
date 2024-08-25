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
  title: string,
): RhymeErrorResponse {
  debugAPI(e, `Rhyme API Error: ${title}`);
  return {
    serverDefinedError: title,
    version: RHYME_VERSION,
    perf: perf(e),
  };
}

// eslint-disable-next-line qwik/loader-location
export const useRhymeLoader = routeLoader$<RhymePackage>(async (e) => {
  if (DEV_DISABLED.rhyme) return buildRhymeAPIError(e, "Rhyme API is disabled");
  // If there is data in cache, return it
  {
    const cache = loadCache(e, "rhyme");
    if (cache) return setSharedMapResult(e, "rhyme", cache);
  } /////////////////////////////
  const sharedMap = loadSharedMap(e);
  /* const [error, response] = await to(fetchAPI(url.api)); */
  const word = sharedMap.query.noNumPlusParenAccL;
  const word_reversed = word.split("").reverse().join("");

  // binary search through the words array using word_reversed to get the index
  let closest = -1;
  {
    let start = 0;
    let end = words.length - 1;
    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      closest = mid;
      if (words[mid] === word_reversed) {
        // index = mid;
        break;
      } else if (words[mid] < word_reversed) {
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }
  }
  const data: RhymePackage = {
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
  const normalCount = 10;
  const moreCount = 50;
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
  const startMore = Math.max(0, closest - moreCount);
  const endMore = Math.min(words.length, closest + moreCount);
  const fromStartMore = words
    .slice(startMore, start)
    .map((w) => w.split("").reverse().join(""))
    .reverse();
  const fromEndMore = words
    .slice(end + 1, endMore)
    .map((w) => w.split("").reverse().join(""));
  const rhymingWordsMore = Array.from(
    { length: Math.max(fromStartMore.length, fromEndMore.length) },
    (_, i) => [fromStartMore[i], fromEndMore[i]],
  )
    .flat()
    .filter(Boolean);

  return setSharedMapResult(e, "rhyme", {
    ...data,
    items: rhymingWords,
    more_items: rhymingWordsMore,
  });
});
