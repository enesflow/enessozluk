import type {
  NisanyanAffixResponse,
  NisanyanAffixResponseError,
  NisanyanEtymology,
  NisanyanResponse,
  NisanyanResponseError,
  NisanyanWord,
} from "#/nisanyan";
import { API_FAILED_TEXT } from "#helpers/constants";
import { convertToRoman } from "#helpers/roman";
import { removeNumbersAtEnd, removeNumbersInWord } from "#helpers/string";
import { component$ } from "@builder.io/qwik";
import { Link, routeLoader$, server$ } from "@builder.io/qwik-city";
import { Recommendations } from "~/components/recommendations";
import { TextWithLinks } from "../textwithlinks";

const NISANYAN_URL = "https://www.nisanyansozluk.com/api/words/" as const;
const NISANYAN_AFFIX_URL =
  "https://www.nisanyansozluk.com/api/affixes-1/" as const;
const NISANYAN_ABBREVIATIONS = {
  Fa: "Farsça",
  Ger: "Germence",
  EYun: "Eski Yunanca",
  Ar: "Arapça",
  İng: "İngilizce",
  Sans: "Sanskritçe",
  Ave: "Avestaca",
  ETü: "Eski Türkçe",
  Gürc: "Gürcüce",
  Süry: "Süryanice",
  Erm: "Ermenice",
  Aram: "Aramice",
  Tü: "Türkçe",
  TTü: "Türkiye Türkçesi",
  Lat: "Latince",
  Fr: "Fransızca",
  İt: "İtalyanca",
  İsp: "İspanyolca",
  Alm: "Almanca",
  Yun: "Yunanca",
  Rus: "Rusça",
  Çin: "Çince",
  YTü: "Yeni Türkçe",
  Akad: "Akatça",
  İbr: "İbranice",
  HAvr: "Hintavrupa Anadili",
  Moğ: "Moğolca",
  Çağ: "Çağatayca",
} as const; // TODO: Complete the list
const NISANYAN_NO_RESULT = "Sonuç bulunamadı" as const;
const NISANYAN_LINK_REGEX = /%l/g;
const NISANYAN_NEWLINE_DET = "● " as const;

function convertDate(date: string): string {
  if (date.startsWith("<")) {
    return `${date.slice(1)} yılından önce`;
  }
  return date;
}
function putTheNumbersAtTheEndAsRomanToTheBeginning(text: string): string {
  // example: a1 -> (I) a
  const match = text.match(/(\d+)$/);
  if (match) {
    const number = match[1];
    const romanNumber = convertToRoman(parseInt(number));
    return `(${romanNumber}) ${text.replace(number, "").trim()}`;
  }
  return text;
}

function formatSpecialChars(str: string): string {
  // Handle nested tags by processing them in stages
  const stages = [
    { pattern: /%i(\S+)/g, replacement: "<i>$1</i>" }, // Italic
    { pattern: /%[bu](\S+)/g, replacement: "<b>$1</b>" }, // Bold
    { pattern: /%r(\S+)/g, replacement: "<i>$1</i>" }, // TODO: Find a way to handle %r (for example: look at "uçmak", %rBarth -> Christian Bartholomae, Altiranisches Wörterbuch)
    {
      pattern: /%s(\S+)/g,
      replacement: '<span style="font-variant: small-caps;">$1</span>',
    }, // Small caps
  ];

  for (const stage of stages) {
    str = str.replace(stage.pattern, stage.replacement);
  }

  // Handle combination of tags explicitly if necessary
  str = str.replace(/%i(\S+)%b/g, "<i><b>$1</b></i>"); // Italic then bold
  str = str.replace(/%b(\S+)%i/g, "<b><i>$1</i></b>"); // Bold then italic

  return str;
}

function replaceAbbrevations(str: string, data: NisanyanResponse): string {
  const languages: Record<string, string> = NISANYAN_ABBREVIATIONS;
  for (const word of data.words ?? []) {
    if (!word.etymologies) continue;
    for (const etymology of word.etymologies) {
      for (const language of etymology.languages) {
        languages[language.abbreviation] = language.name;
      }
    }
  }

  let result = str;
  for (const [abbreviation, language] of Object.entries(languages)) {
    // to replace the words make sure one of these two conditions are met:
    // 1. the word is surrounded by two spaces
    // 2. the word is at the beginning of the string and followed by a space
    // 3. the word is surrounded by > and < (for HTML tags) (example: <i>tr</i>)
    // 4. the word has a comma, dot, colon, semicolon, question mark or a parenthesis at the end
    // 5. the word is at the end of the string
    if (abbreviation !== "?") {
      // if we don't do this if check, the regex will be broken
      // because of the question mark (see the word "kuşku")
      //const pattern = new RegExp(`(?<=^|\\s|>)${abbreviation}(?=\\s|$|<)`, "g");
      // the above regex is the old one without support for the fourth condition
      // this is the new one with the fourth and fifth conditions
      /*  const pattern = new RegExp(
        `(?<=^|\\s|>|,|\\.|:|;|\\?|\\()${abbreviation}(?=\\s|$|<|,|\\.|:|;|\\?|\\))`,
        "g",
      ); */
      // entirely new rules:
      // the word is at the beginning of the string OR
      // the word has a space, , . : ; ? ( ) / at the beginning OR
      // the word has a space, , . : ; ? ( ) / at the end OR
      // the word is at the end of the string
      const pattern = new RegExp(
        `(?<=^|\\s|,|\\.|:|;|\\?|\\(|\\)|\\/|>)${abbreviation}(?=\\s|$|,|\\.|:|;|\\?|\\(|\\)|\\/|<)`,
        "g",
      );
      result = result.replace(pattern, language);
    }
  }

  return result;
}

export function formatDefinition(etymology: NisanyanEtymology): string {
  if (etymology.definition.includes("a.a.")) {
    return `aynı anlama gelen ${formatOrigin(etymology)}`;
  } else {
    return (
      formatOrigin(etymology) +
      (etymology.definition
        ? ` "${etymology.definition.replace("mec.", "mecazi")}"`
        : "")
    );
  }
}

export function formatOrigin(etm: NisanyanEtymology): string {
  if (etm.romanizedText.startsWith("*")) {
    etm.romanizedText = `yazılı örneği bulunmayan ${etm.romanizedText}`;
  }
  const romanized = etm.romanizedText
    .split("/")
    .map((text) => removeNumbersAtEnd(text));
  const original = etm.originalText.split("/");
  const con: string[] = [];
  for (let i = 0; i < romanized.length; i++) {
    con.push(`${romanized[i]}${original[i] ? ` (${original[i]})` : ""}`);
  }
  return con.join(" veya ");
}

export function formatRelation(etm: NisanyanEtymology): string {
  if (etm.relation.abbreviation == "+") {
    return etm.serverDefinedEndOfJoin ? " sözcüklerinin bileşiğidir." : "";
  } else if (etm.relation.abbreviation == "§") return "";
  else if (etm.languages[0].abbreviation === "onom")
    return " ses yansımalı sözcüğüdür.";
  else {
    /* return ` ${
      {
        ö: "özel ismi",
        f: "fiili",
        s: "sözcüğü",
        b: "biçimi",
        d: "deyimi",
      }[etm.wordClass.abbreviation] ?? etm.wordClass.name
    }${etm.relation.text.startsWith(" ") ? "" : "n"}${etm.relation.text.split(" ")[0]}${etm.affixes?.prefix ? ` %l${etm.affixes.prefix.name} ön ekiyle ` : ""}${etm.affixes?.suffix ? ` %l${etm.affixes.suffix.name} ekiyle ` : ""} ${etm.relation.text.split(" ").slice(1).join(" ")}.`; */
    // let's break up this bad boy, this code is too hard to read
    const relationOverride = {
      "~?": "bir sözcükten alıntı olabilir; ancak bu kesin değildir.",
    } as Record<string, string>;
    const _relationOverrid = relationOverride[etm.relation.abbreviation];
    const _relation = (_relationOverrid || etm.relation.text).split(" ");
    const relationFirst = _relation.shift();
    const relationRest = " " + _relation.join(" ");

    const wordClass = _relationOverrid
      ? ""
      : ({
          ö: "özel ismi",
          f: "fiili",
          s: "sözcüğü",
          b: "biçimi",
          d: "deyimi",
          k: "kökü",
        }[etm.wordClass.abbreviation] ?? etm.wordClass.name) +
        (etm.relation.text.startsWith(" ") ? "" : "n");

    const prefix = etm.affixes?.prefix
      ? ` %l${etm.affixes.prefix.name} ön ekiyle `
      : "";
    const suffix = etm.affixes?.suffix
      ? ` %l${etm.affixes.suffix.name} ekiyle `
      : "";
    const dot = relationRest.endsWith(".") ? "" : ".";
    return (
      " " + wordClass + relationFirst + prefix + suffix + relationRest + dot
    );
  }
}

export function fixForJoinedWords(
  data: NisanyanResponse | NisanyanResponseError,
): NisanyanResponse | NisanyanResponseError {
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

function joinAllItemsEndingInWords(data: any): NisanyanWord[] {
  //get all the keys
  const keys = Object.keys(data);
  let result = [] as any;
  for (const key of keys) {
    if (key.toLocaleLowerCase().endsWith("words")) {
      result = result.concat(data[key]);
    }
  }
  return result;
}

export const getNisanyanAffixAsNisanyanResponse = server$(async function (
  query: string,
): Promise<NisanyanResponse | NisanyanResponseError> {
  const url =
    `${NISANYAN_AFFIX_URL}${encodeURIComponent(query)}?session=${this.sharedMap.get("sessionUUID") as string}` as const;
  const response = await fetch(url);
  const data = (await response.json()) as
    | NisanyanAffixResponse
    | NisanyanAffixResponseError;
  if ("error" in data) {
    return {
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
  } else {
    // return in a way so that we don't have to write a new ui for affixes
    // return it as it's a word
    data.affix.language;
    const words = joinAllItemsEndingInWords(data);
    return {
      isUnsuccessful: false,
      words: [
        {
          serverDefinedTitleDescription: `${words.length} kelime`,
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
      ] satisfies NisanyanWord[],
      fiveAfter: [],
      fiveBefore: [],
      randomWord: {
        _id: "1",
        name: "Rastgele",
      },
    };
  }
});

// eslint-disable-next-line qwik/loader-location
export const useNisanyanLoader = routeLoader$<
  NisanyanResponse | NisanyanResponseError
>(async ({ params, redirect, sharedMap }) => {
  try {
    if (
      params.query.startsWith("+") ||
      removeNumbersInWord(params.query).endsWith("+")
    ) {
      const response = await getNisanyanAffixAsNisanyanResponse(params.query);
      if (!response.isUnsuccessful) return response;
      // Well, this is a bad fix for this. It will make our app slower. Try the query "+loji" for the problem.
      else {
        // remove all + ( and )
        throw redirect(
          301,
          `/search/${encodeURIComponent(
            params.query.replace(/\(|\)|\+/g, ""),
          )}`,
        );
      }
    }
    const url =
      `${NISANYAN_URL}${params.query}?session=${sharedMap.get("sessionUUID") as string}` as const;
    const response = await fetch(url);
    const data = (await response.json()) as
      | NisanyanResponse
      | NisanyanResponseError;
    if ("error" in (data as any)) {
      data.isUnsuccessful = true;
    }
    return fixForJoinedWords(data);
  } catch (error) {
    console.error(error);
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
          name: params.query,
        },
      ],
    };
  }
});

export const WordLinks = component$<{ words: string[] }>(({ words }) => {
  return (
    <>
      {words.map((word, index) => (
        <span key={word} class="result-description">
          <Link href={`/search/${removeNumbersAtEnd(word)}`}>
            {putTheNumbersAtTheEndAsRomanToTheBeginning(word)}
          </Link>
          {index < words.length - 1 && ", "}
        </span>
      ))}
    </>
  );
});

export const NisanyanView = component$<{
  data: NisanyanResponse | NisanyanResponseError;
}>(({ data }) => {
  return (
    <>
      {data.isUnsuccessful ? (
        <>
          <p class="error-message">
            {data.serverDefinedErrorText ?? NISANYAN_NO_RESULT}
          </p>
          {data.words && (
            <>
              <div class="result-item result-subitem">
                Öneriler:{" "}
                <Recommendations
                  words={Array.from(
                    new Set([
                      ...data.words.map((word) =>
                        removeNumbersAtEnd(word.name),
                      ),
                      ...(data.fiveAfter?.map((word) =>
                        removeNumbersAtEnd(word.name),
                      ) || []),
                      ...(data.fiveBefore?.map((word) =>
                        removeNumbersAtEnd(word.name),
                      ) || []),
                    ]),
                  )}
                />
              </div>
            </>
          )}
        </>
      ) : (
        <ul class="results-list">
          {data.words?.map((word, index) => (
            <li key={word._id} class="result-item">
              <h2 class="result-title">
                ({convertToRoman(index + 1)}) {removeNumbersAtEnd(word.name)}
                <i class="result-title-description">
                  {word.serverDefinedTitleDescription && (
                    <> ({word.serverDefinedTitleDescription ?? ""})</>
                  )}
                </i>
              </h2>
              <section class="result-section">
                <h2 class="result-subtitle">Köken</h2>
                {(word.etymologies ?? []).length > 0 &&
                  word.etymologies?.map((etymology, index) => (
                    <ul key={index} class="result-list">
                      <li
                        class={`${index !== 0 ? "list-none" : " "} ${"result-subitem"} ${etymology.serverDefinedMoreIndentation ? "result-double-subitem" : ""}`}
                      >
                        {etymology.relation.abbreviation === "+" &&
                        index !== 0 ? (
                          <span>ve </span>
                        ) : (
                          index !== 0 && <span>Bu sözcük </span>
                        )}
                        {etymology.languages.every(
                          (language) => language.abbreviation === "?",
                        ) ? (
                          <span> Bu sözcüğün kökeni belirsizdir.</span>
                        ) : (
                          <>
                            <strong>
                              {etymology.languages
                                .map((lang) => lang.name)
                                .join(", ")}
                            </strong>
                            <span> {formatDefinition(etymology)}</span>
                            <TextWithLinks
                              regex={NISANYAN_LINK_REGEX}
                              text={formatRelation(etymology)}
                            />
                          </>
                        )}
                      </li>
                    </ul>
                  ))}
                {word.references.length > 0 && (
                  <p class="result-description">
                    Daha fazla bilgi için{" "}
                    <WordLinks words={word.references.map((ref) => ref.name)} />{" "}
                    maddelerine bakınız.
                  </p>
                )}
              </section>
              {word.note && (
                <section class="result-section">
                  <h2 class="result-subtitle">Ek açıklama</h2>
                  <ul class="result-list">
                    {word.note
                      .split(NISANYAN_NEWLINE_DET)
                      .map((note, index) => (
                        <li key={index} class="result-subitem">
                          <TextWithLinks
                            regex={NISANYAN_LINK_REGEX}
                            text={replaceAbbrevations(
                              formatSpecialChars(note),
                              data,
                            )}
                          />
                        </li>
                      ))}
                  </ul>
                </section>
              )}
              {word.similarWords && (
                <section class="result-section">
                  <h2 class="result-subtitle">Benzer sözcükler</h2>
                  <WordLinks words={word.similarWords} />
                </section>
              )}
              {word.referenceOf && (
                <section class="result-section">
                  <h2 class="result-subtitle">Bu maddeye gönderenler</h2>
                  <WordLinks words={word.referenceOf.map((ref) => ref.name)} />
                </section>
              )}
              {!word.histories ? (
                <p class="result-description">
                  <i>Henüz tarihçe eklenmemiş.</i>
                </p>
              ) : (
                <section class="result-section">
                  <h2 class="result-subtitle">
                    Tarihçe (tespit edilen en eski Türkçe kaynak ve diğer
                    örnekler)
                  </h2>
                  {word.histories.map((history, index) => (
                    <div key={index} class="result-subitem">
                      <p>
                        <strong>{history.language?.name}</strong>
                        <span>
                          {" "}
                          [
                          {history.source?.book ||
                            history.source?.name ||
                            "Bilinmiyor"}
                          , {convertDate(history.date)}]
                        </span>
                      </p>
                      <span class="result-quote">
                        <TextWithLinks
                          regex={NISANYAN_LINK_REGEX}
                          text={formatSpecialChars(history.quote)}
                        />
                      </span>
                    </div>
                  ))}
                </section>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
});
