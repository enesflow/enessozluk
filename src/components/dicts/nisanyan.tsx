import type {
  NisanyanEtymology,
  NisanyanResponse,
  NisanyanWordPackage,
} from "#/nisanyan";
import { NO_RESULT } from "#helpers/constants";
import { convertToRoman } from "#helpers/roman";
import { removeNumbersAtEnd, removeNumbersInWord } from "#helpers/string";
import { component$ } from "@builder.io/qwik";
import { putTheNumbersAtTheEndAsRomanToTheBeginning } from "~/components/WordLinks";
import { LinkR } from "../linkWithRedirect";
import { TextWithLinks } from "../textwithlinks";
import { WordLinks } from "../WordLinks";
import { joinTurkish } from "~/helpers/parser";

//const NISANYAN_AFFIX_URL = "https://www.nisanyansozluk.com/api/affixes-1/" as const;
const NISANYAN_ABBREVIATIONS = {
  "(a.a.)": "aynı anlamda", // don't add parantheses, check the usage, it adds parantheses for some reason, don't bother
  Fa: "Farsça",
  Ger: "Germence",
  EYun: "Eski Yunanca",
  Ar: "Arapça",
  İng: "İngilizce",
  Sans: "Sanskritçe",
  Ave: "Avestaca",
  ETü: "Eski Türkçe",
  OFa: "Orta Farsça",
  ET: "Eski Türkçe",
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
  Mac: "Macarca",
  Kürd: "Kürtçe (Kurmanci)",
  İr: "Proto-İranca (Ana-İranca)",
  ÇTü: "Çağatayca",
  Uyg: "Uygurca",
  Kzk: "Kazakça",
  Tat: "Tatarca",
  Sogd: "Soğdca", 
} as const; // TODO: Complete the list
const NISANYAN_LINK_REGEX = /%l/g;
const NISANYAN_NEWLINE_DET_REGEX = /(?:● |• )/g;

function convertDate(date: string): string {
  if (date.startsWith("<")) {
    return `${date.slice(1)} yılından önce`;
  }
  return date;
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
        if (language.abbreviation)
          (languages as any)[language.abbreviation] = language.name;
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

function formatDefinition(etymology: NisanyanEtymology): string {
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

function formatOrigin(etm: NisanyanEtymology): string {
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

function formatRelation(
  etm: NisanyanEtymology,
  prev: NisanyanEtymology | undefined,
  next: NisanyanEtymology | undefined,
): string {
  const doesWordClassRequireABackVowel = {
    p: true,
  } as Record<string, boolean>;
  if (etm.relation.abbreviation == "+") {
    return etm.serverDefinedEndOfJoin ? " sözcüklerinin bileşiğidir." : "";
  } else if (etm.relation.abbreviation == "§") return "";
  else if (etm.languages[0].abbreviation === "onom")
    return " ses yansımalı sözcüğüdür.";
  else {
    const isOr = etm.relation.abbreviation === "/";
    const orNext = next?.relation.abbreviation === "/";
    const relationOverride = {
      "~?": "bir sözcükten alıntı olabilir; ancak bu kesin değildir.",
    } as Record<string, string>;
    const _relationOverrid = relationOverride[etm.relation.abbreviation];
    const _relation =
      (_relationOverrid || (isOr ? prev : etm)?.relation.text)?.split(" ") ??
      [];
    // const relationFirst = _relation.shift();
    const relationFirst = doesWordClassRequireABackVowel[
      etm.wordClass.abbreviation
    ]
      ? _relation.shift() && ("dan" as string | null) // 👍 Yes this is clean code
      : _relation.shift();
    const relationRest = " " + (orNext ? "veya" : _relation.join(" "));
    const wordClass = _relationOverrid
      ? ""
      : ({
          ö: "özel ismi",
          f: "fiili",
          s: "sözcüğü",
          b: "biçimi",
          d: "deyimi",
          k: "kökü",
          p: "edatı",
        }[etm.wordClass.abbreviation] ?? etm.wordClass.name) +
        (etm.relation.text.startsWith(" ") ? "" : "n");

    const prefix = etm.affixes?.prefix
      ? ` %l${etm.affixes.prefix.name} ön ekiyle `
      : "";
    const suffix = etm.affixes?.suffix
      ? ` %l${etm.affixes.suffix.name} ekiyle `
      : "";
    const dot = orNext ? false : true;
    const base = (
      " " +
      wordClass +
      relationFirst +
      prefix +
      suffix +
      relationRest
    ).replace(/\.$/, "");

    // if dot, + "." else, remove the dot at the end if it exists with regex
    return dot ? base + "." : base;
  }
}

function getWordTitle(index: number, name: string) {
  if (/\d$/.test(name)) {
    return `${putTheNumbersAtTheEndAsRomanToTheBeginning(name)}`;
  } else {
    return `(${convertToRoman(index + 1)}) ${removeNumbersInWord(name)}`;
  }
}

export const NisanyanView = component$<{
  data: NisanyanWordPackage;
}>(({ data }) => {
  return (
    <>
      {data.isUnsuccessful ? (
        <>
          <p class="error-message">
            {data.serverDefinedErrorText ?? NO_RESULT}
          </p>
          {data.words && (
            <>
              <div class="result-item result-subitem">
                Öneriler:{" "}
                <WordLinks
                  words={Array.from(
                    new Set([
                      ...data.words.map((word) => word.name),
                      ...(data.fiveAfter?.map((word) => word.name) || []),
                      ...(data.fiveBefore?.map((word) => word.name) || []),
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
                {/* */}
                {word.serverDefinedIsMisspelling ? (
                  <LinkR href={`/search/${word.name}`}>
                    {getWordTitle(index, word.name)}
                  </LinkR>
                ) : (
                  <>{getWordTitle(index, word.name)}</>
                )}
                <i class="result-title-description">
                  {word.serverDefinedTitleDescription && (
                    <> ({word.serverDefinedTitleDescription ?? ""})</>
                  )}
                </i>
              </h2>
              <section class="result-section">
                <h2 class="result-subtitle">Köken</h2>
                {!!word.etymologies?.length &&
                  word.etymologies.map((etymology, index) => (
                    <ul key={index} class="result-list">
                      <li
                        class={`${index !== 0 ? "list-none" : " "} ${"result-subitem"} ${etymology.serverDefinedMoreIndentation ? "result-double-subitem" : ""}`}
                      >
                        {etymology.languages.every(
                          (language) => language.abbreviation === "?",
                        ) ? (
                          <span> Bu sözcüğün kökeni belirsizdir.</span>
                        ) : (
                          <>
                            {etymology.relation.abbreviation === "+" &&
                            index !== 0 ? (
                              <span>ve </span>
                            ) : (
                              index !== 0 &&
                              etymology.relation.abbreviation !== "/" && (
                                <span>
                                  {etymology.serverDefinedMoreIndentation &&
                                    !word.etymologies?.[index - 1]
                                      .serverDefinedMoreIndentation &&
                                    "Not: "}
                                  Bu sözcük{" "}
                                </span>
                              )
                            )}
                            <strong>
                              {joinTurkish(
                                etymology.languages.map((lang) => lang.name),
                              )}
                            </strong>
                            <span> {formatDefinition(etymology)}</span>
                            <TextWithLinks
                              regex={NISANYAN_LINK_REGEX}
                              text={formatRelation(
                                etymology,
                                word.etymologies?.[index - 1],
                                word.etymologies?.[index + 1],
                              )}
                            />
                          </>
                        )}
                      </li>
                    </ul>
                  ))}
                {!!word.references?.length && (
                  <p class="result-description">
                    Daha fazla bilgi için{" "}
                    <WordLinks
                      words={word.references!.map((ref) => ref.name)}
                    />{" "}
                    maddelerine bakınız.
                  </p>
                )}
              </section>

              {word.note && (
                <section class="result-section">
                  <h2 class="result-subtitle">
                    {data.serverDefinedIsGeneratedFromAffix
                      ? "Açıklama"
                      : "Ek açıklama"}
                  </h2>
                  <ul class="result-list">
                    {word.note
                      .split(NISANYAN_NEWLINE_DET_REGEX)
                      .map((note, index) => (
                        <li key={index} class="result-subitem">
                          <TextWithLinks
                            regex={NISANYAN_LINK_REGEX}
                            text={replaceAbbrevations(
                              formatSpecialChars(note),
                              data as NisanyanResponse, // TODO: Fix this
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
              {word.misspellings && (
                <section class="result-section">
                  <h2 class="result-subtitle">Yanlış yazımlar</h2>
                  <WordLinks words={word.misspellings} />
                </section>
              )}
              {!data.serverDefinedIsGeneratedFromAffix &&
                (!word.histories ? (
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
                ))}
            </li>
          ))}
        </ul>
      )}
    </>
  );
});
