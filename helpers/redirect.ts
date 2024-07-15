import { removeNumbersInWord } from "#helpers/string";

export function flattenVerb(verb: string): string {
  // if hyphen then add mak or mek
  if (verb.endsWith("-")) {
    const lower = verb.toLocaleLowerCase("tr");
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
      return noHyphen + toAdd;
    }
  }
  return verb;
}

export function getRedirect(
  url: URL,
  params: { query: string },
):
  | {
      shouldRedirect: true;
      to: string;
      code: 301;
    }
  | {
      shouldRedirect: false;
    } {
  const queryWithoutNumbers = removeNumbersInWord(params.query);
  const lower = queryWithoutNumbers.toLocaleLowerCase("tr");

  // FOR NISANYAN AFFIXES
  if (
    queryWithoutNumbers.startsWith("+") ||
    queryWithoutNumbers.endsWith("+")
  ) {
    return {
      shouldRedirect: false,
    };
  }
  const to = `/search/${encodeURIComponent(flattenVerb(lower))}/`;
  if (url.pathname !== to) {
    return {
      shouldRedirect: true,
      to,
      code: 301,
    };
  }
  if (lower !== params.query) {
    if (lower !== "") {
      // for example, if the query is "Enes2", redirect to "enes"
      /* throw redirect(301, `/search/${encodeURIComponent(lower)}/`); */
      return {
        shouldRedirect: true,
        to: `${url.origin}/search/${encodeURIComponent(lower)}/`,
        code: 301,
      };
    }
  }

  /* await next(); */
  return {
    shouldRedirect: false,
  };
}

export function getLink(href: string | undefined): string {
  if (!href) {
    return "";
  }
  const url = new URL(href);
  // if shouldredirect return to, else return href
  const red = getRedirect(url, {
    query: href.split("/").pop() || "",
  });
  if (red.shouldRedirect) {
    return red.to;
  }
  return href;
}
