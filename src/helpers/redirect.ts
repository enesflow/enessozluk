import { removeNumbersInWord } from "#helpers/string";

export function flattenVerb(verb: string): string {
  // if hyphen then add mak or mek
  if (verb.endsWith("-")) {
    //const lower = verb.toLocaleLowerCase("tr");
    const lastVowel = verb.match(/[aeıioöuüAEIİOÖUÜ]/gi)?.slice(-1);
    // if it's a back vowel, add "mak" to the end
    // if it's a front vowel, add "mek" to the end
    if (lastVowel) {
      const [vowel] = lastVowel;
      const noHyphen = verb.slice(0, -1);
      let toAdd = "";
      if ("eiüö".includes(vowel)) {
        toAdd = "mek";
      } else if ("aıou".includes(vowel)) {
        toAdd = "mak";
      } else if ("EİÜÖ".includes(vowel)) {
        toAdd = "MEK";
      } else if ("AIOU".includes(vowel)) {
        toAdd = "MAK";
      } else {
        console.error(
          "THERE IS A MISMATCH BETWEEN THE IF STATEMENTS AND THE VOWELS IN flattenVerb",
        );
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
  const query = removeNumbersInWord(params.query);
  // const lower = queryWithoutNumbers.toLocaleLowerCase("tr");

  // FOR NISANYAN AFFIXES
  if (query.startsWith("+") || query.endsWith("+")) {
    return {
      shouldRedirect: false,
    };
  }
  const to = `/search/${encodeURIComponent(flattenVerb(query))}/`;
  if (url.pathname !== to) {
    return {
      shouldRedirect: true,
      to,
      code: 301,
    };
  }
  if (query !== params.query) {
    if (query !== "") {
      // for example, if the query is "Enes2", redirect to "enes"
      /* throw redirect(301, `/search/${encodeURIComponent(lower)}/`); */
      return {
        shouldRedirect: true,
        to: `${url.origin}/search/${encodeURIComponent(query)}/`,
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
  const res = red.shouldRedirect ? red.to : href;
  // make the last item (splitted by /) encodeURIComponent
  const splitted = res.split("/");
  const last = splitted.pop();
  if (last) {
    splitted.push(encodeURIComponent(last));
  }
  return splitted.join("/");
}
