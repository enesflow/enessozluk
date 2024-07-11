import type { NisanyanResponse, NisanyanResponseError } from "#/nisanyan";
import { generateUUID, convertToRoman } from "#helpers/roman";
import { component$ } from "@builder.io/qwik";
import { Link, routeLoader$ } from "@builder.io/qwik-city";
import { TextWithLinks } from "../textwithlinks";
import { Recommendations } from "~/components/recommendations";
import { removeNumbersAtEnd } from "#helpers/string";

const NISANYAN_URL = "https://www.nisanyansozluk.com/api/words/" as const;
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
} as const; // TODO: Complete the list
const NISANYAN_NO_RESULT = "Sonuç bulunamadı" as const;
const NISANYAN_LINK_REGEX = /%l/g;

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

// eslint-disable-next-line qwik/loader-location
export const useNisanyanLoader = routeLoader$<
  NisanyanResponse | NisanyanResponseError
>(async ({ params }) => {
  const url = `${NISANYAN_URL}${params.query}?session=${generateUUID()}`;
  const response = await fetch(url);
  const data = (await response.json()) as
    | NisanyanResponse
    | NisanyanResponseError;
  if ("error" in (data as any)) {
    data.isUnsuccessful = true;
  }
  return data;
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
          <p class="error-message">{NISANYAN_NO_RESULT}</p>
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
                      ...data.fiveAfter.map((word) =>
                        removeNumbersAtEnd(word.name),
                      ),
                      ...data.fiveBefore.map((word) =>
                        removeNumbersAtEnd(word.name),
                      ),
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
              <section class="result-section">
                <h2 class="result-subtitle">Köken</h2>
                {word.etymologies.map((etymology, index) => (
                  <ul key={index} class="result-list">
                    <li class="result-subitem">
                      <strong>{etymology.languages[0].name}</strong>
                      <span> {etymology.romanizedText}</span>
                      {etymology.originalText && (
                        <span> ({etymology.originalText})</span>
                      )}
                      <span>
                        {" "}
                        {etymology.definition.includes("a.a.")
                          ? etymology.definition.replace(
                              "a.a.",
                              "(aynı anlama sahip)",
                            )
                          : `"${etymology.definition}"`}
                      </span>
                      <span> {etymology.relation.text}</span>
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
                  <TextWithLinks
                    regex={NISANYAN_LINK_REGEX}
                    text={replaceAbbrevations(
                      formatSpecialChars(word.note),
                      data,
                    )}
                  />
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
