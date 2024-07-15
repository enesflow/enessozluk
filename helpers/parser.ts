import type { BenzerPackage } from "#/benzer";
import type { LuggatPackage, LuggatResponse } from "#/luggat";
import { API_FAILED_TEXT, NO_RESULT } from "#helpers/constants";
import { load } from "cheerio";

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
export function parseLuggat(data: string): LuggatPackage {
  try {
    const $ = load(data);
    const words: LuggatResponse["words"] = [];
    const wordElements = $(".arama-sonucu-div");
    if (wordElements.length === 0) {
      return { isUnsuccessful: true };
    }
    wordElements.each((index, element) => {
      const name = $(element)
        .find("h2.heading-5")
        .text()
        .trim()
        .replace(/\s+/g, " ");
      const definitions: string[] = [];
      $(element)
        .find("ol li")
        .each((_, li) => {
          const definition = $(li).text().trim();
          definitions.push(definition);
        });
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
    return {
      isUnsuccessful: false,
      words: consolidateEntries(words),
    };
  } catch (error) {
    console.error("LUGGAT PARSING FAILED", error);
    return {
      isUnsuccessful: true,
      serverDefinedErrorText: API_FAILED_TEXT,
    };
  }
}

////////

export function parseBenzer(data: string, query: string): BenzerPackage {
  const $ = load(data);

  // Extract words from the first list
  const words = new Set<string>();
  const entryContentMain = $(".entry-content-main ul li a");

  if (entryContentMain.length === 0) {
    const words: string[] = [];
    const captchaButton = $(
      "body > main > div.page > div > div.page-main > div > div.page-content > div > form > div > span:nth-child(2) > span > button",
    );
    if (captchaButton.length > 0) {
      return {
        isUnsuccessful: true,
        serverDefinedCaptchaError: true,
        serverDefinedErrorText:
          "Lütfen yukarıdan robot olmadığınızı doğrulayın.",
        words: ["Tekrar", "dene-", query],
      };
    }
    const suggestionBox = $(".suggestion-box > ul:nth-child(2) li a");
    if (suggestionBox.length === 0) {
      return {
        isUnsuccessful: true,
      };
    }
    suggestionBox.each((_, element) => {
      words.push($(element).text());
    });

    return {
      isUnsuccessful: true,
      words,
    };
  }

  entryContentMain.each((_, element) => {
    words.add($(element).text());
  });

  // Extract more words from the second list
  const moreWords: { [key: string]: string[] } = {};
  $(".entry-content-sub").each((_, element) => {
    const category = $(element)
      .find(".entry-content-sub-title a")
      .first()
      .text();
    const categoryWords = new Set<string>();
    $(element)
      .find(".entry-content-sub-content ul li a")
      .each((_, elem) => {
        const text = $(elem).text();
        if (!words.has(text)) {
          categoryWords.add(text);
        }
      });
    moreWords[category] = Array.from(categoryWords);
  });

  if (words.size === 0) {
    return {
      isUnsuccessful: true,
      serverDefinedErrorText: NO_RESULT,
    };
  }

  return {
    isUnsuccessful: false,
    words: Array.from(words),
    moreWords,
  };
}
