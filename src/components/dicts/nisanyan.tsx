import type {
  NisanyanAffixResponse,
  NisanyanAffixResponseError,
  NisanyanEtymology,
  NisanyanResponse,
  NisanyanResponseError,
  NisanyanWord,
} from "#/nisanyan";
import { API_FAILED_TEXT } from "#helpers/constants";
import { convertToRoman, generateUUID } from "#helpers/roman";
import { removeNumbersAtEnd } from "#helpers/string";
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
  TTü: "Türkiye Türkçesi",
  Lat: "Latince",
  Fr: "Fransızca",
  İt: "İtalyanca",
  İsp: "İspanyolca",
  Alm: "Almanca",
  Yun: "Yunanca",
  Rus: "Rusça",
  Çin: "Çince",
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
    const pattern = new RegExp(`(?<=^|\\s|>)${abbreviation}(?=\\s|$|<)`, "g");
    result = result.replace(pattern, language);
  }

  return result;
}

export function formatDefinition(etymology: NisanyanEtymology): string {
  if (etymology.definition.includes("a.a.")) {
    return `aynı anlama gelen ${formatOrigin(etymology)}`;
  } else {
    return (
      formatOrigin(etymology) +
      (etymology.definition ? ` "${etymology.definition}"` : "")
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
  if (etm.relation.abbreviation == "+") return `sözcüklerinin bileşiğidir.`;
  else if (etm.relation.abbreviation == "§") return "";
  else
    return ` ${
      {
        ö: "özel ismin",
        f: "fiilin",
        s: "sözcüğün",
        b: "biçimin",
      }[etm.wordClass.abbreviation] ?? etm.wordClass.name
    }${etm.relation.text.split(" ")[0]}${etm.affixes?.prefix ? ` %l${etm.affixes.prefix.name} ön ekiyle ` : ""}${etm.affixes?.suffix ? ` %l${etm.affixes.suffix.name} ekiyle ` : ""} ${etm.relation.text.split(" ")[1]}`;
}

export function fixForJoinedWords(
  data: NisanyanResponse | NisanyanResponseError,
): NisanyanResponse | NisanyanResponseError {
  if (data.isUnsuccessful) return data;
  if (!data.words) return data;
  for (let wordIndex = 0; wordIndex < data.words.length; wordIndex++) {
    const word = data.words[wordIndex];
    let detected = false;
    for (let etmIndex = 0; etmIndex < word.etymologies.length; etmIndex++) {
      const etm = word.etymologies[etmIndex];
      if (
        etm.relation.abbreviation == "+" ||
        etm.relation.abbreviation == "§"
      ) {
        detected = true;
      } else if (detected) {
        data.words[wordIndex].etymologies[
          etmIndex
        ].serverDefinedMoreIndentation = true;
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

export const getNisanyanAffixAsNisanyanResponse = server$(
  async (query: string): Promise<NisanyanResponse | NisanyanResponseError> => {
    const url = `${NISANYAN_AFFIX_URL}${encodeURIComponent(query)}?session=${generateUUID()}`;
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
      const res = {
        isUnsuccessful: false,
        words: [
          {
            _id: data.affix._id,
            actualTimeUpdated: data.affix.timeUpdated,
            etymologies: [],
            id_depr: data.affix.id_depr,
            name: `${data.affix.name} (${words.length} kelime)`,
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
      console.log(res.words[0].references);
      return res;
    }
  },
);

// eslint-disable-next-line qwik/loader-location
export const useNisanyanLoader = routeLoader$<
  NisanyanResponse | NisanyanResponseError
>(async ({ params }) => {
  try {
    if (params.query.startsWith("+") || params.query.endsWith("+")) {
      return getNisanyanAffixAsNisanyanResponse(params.query);
    }
    const url = `${NISANYAN_URL}${params.query}?session=${generateUUID()}`;
    const response = await fetch(url);
    const data = (await response.json()) as
      | NisanyanResponse
      | NisanyanResponseError;
    if ("error" in (data as any)) {
      data.isUnsuccessful = true;
    }
    return fixForJoinedWords(data);
  } catch (error) {
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
              </h2>
              {word.etymologies.length > 0 && (
                <section class="result-section">
                  <h2 class="result-subtitle">Köken</h2>
                  {word.etymologies.map((etymology, index) => (
                    <ul key={index} class="result-list">
                      <li
                        class={`${"result-subitem"} ${etymology.serverDefinedMoreIndentation ? "pl-4" : ""}`}
                      >
                        {etymology.relation.abbreviation == "+" && (
                          <span>ve </span>
                        )}
                        <strong>{etymology.languages[0].name}</strong>
                        {<span> {formatDefinition(etymology)}</span>}
                        <TextWithLinks
                          regex={NISANYAN_LINK_REGEX}
                          text={formatRelation(etymology)}
                        />
                      </li>
                    </ul>
                  ))}
                  {word.references.length > 0 && (
                    <p class="result-description">
                      Daha fazla bilgi için{" "}
                      <WordLinks
                        words={word.references.map((ref) => ref.name)}
                      />{" "}
                      maddelerine bakınız.
                    </p>
                  )}
                </section>
              )}
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
