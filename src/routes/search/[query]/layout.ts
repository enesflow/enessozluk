import { generateUUID } from "#helpers/generateUUID";
import { removeNumbersInWord } from "#helpers/string";
import type { RequestHandler } from "@builder.io/qwik-city";

export const onRequest: RequestHandler = async ({
  url,
  params,
  redirect,
  next,
  sharedMap,
  headers,
}) => {
  sharedMap.set("sessionUUID", generateUUID(headers));

  const queryWithoutNumbers = removeNumbersInWord(params.query);
  const lower = queryWithoutNumbers.toLocaleLowerCase("tr");

  // FOR NISANYAN AFFIXES
  if (
    queryWithoutNumbers.startsWith("+") ||
    queryWithoutNumbers.endsWith("+")
  ) {
    await next();
    return;
  }
  // FOR VERBS
  if (queryWithoutNumbers.endsWith("-")) {
    const lastVowel = lower.match(/[aeıioöuü]/gi)?.slice(-1);
    // if it's a back vowel, add "mak" to the end
    // if it's a front vowel, add "mek" to the end
    if (lastVowel) {
      const [vowel] = lastVowel;
      const noHyphen = lower.slice(0, -1);
      let toAdd = "";
      if ("eiüö".includes(vowel.toLowerCase())) {
        toAdd = "mek";
      } else if ("aıou".includes(vowel.toLowerCase())) {
        toAdd = "mak";
      }
      const to = `${url.origin}/search/${encodeURIComponent(noHyphen + toAdd)}/`;
      if (url.pathname !== to) {
        // just to be safe
        throw redirect(301, to);
      }
    }
  }
  if (lower !== params.query) {
    if (lower !== "") {
      // for example, if the query is "Enes2", redirect to "enes"
      throw redirect(301, `/search/${encodeURIComponent(lower)}/`);
    }
  }

  await next();
};
