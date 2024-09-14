import { component$ } from "@builder.io/qwik";
import { isTruthy } from "~/helpers/filter";
import type { NName, NNamesError, NNamesPackage } from "~/types/nnames";
import { WordLink, WordLinks } from "../WordLinks";
import { formatSpecialChars, replaceAbbrevations } from "./nisanyan";

export function isNNamesFailed(data: NNamesPackage): data is NNamesError {
  return data.isSuccessful === false;
}

function getGender(data: NName): string {
  const w = data.communities.female.isPredominant;
  const m = data.communities.male.isPredominant;
  /* return [w && "Kadın", m && "Erkek"].filter(Boolean).join(" ve "); */
  // if w is more (.countOld.female > .countOld.male) then show "Kadın" first, else show "Erkek" first
  return [
    w
      ? {
          text: "Kadın",
          count: data.countOld.female,
        }
      : {
          text: data.communities.female.items.length
            ? data.communities.female.items.join(", ") + " kadın"
            : "",
          count: data.countOld.female,
        },
    m
      ? {
          text: "Erkek",
          count: data.countOld.male,
        }
      : {
          text: data.communities.male.items.length
            ? data.communities.male.items.join(", ") + " erkek"
            : "",
          count: data.countOld.male,
        },
  ]
    .filter(isTruthy)
    .filter((g) => g.text.trim().length)
    .sort((a, b) => b.count - a.count)
    .map((g) => g.text)
    .join(" ve ");
}

export const NNamesView = component$<{
  data: NNamesPackage;
}>(({ data }) => {
  return (
    <>
      {isNNamesFailed(data) ? (
        <>
          <p class="error-message">{data.serverDefinedError}</p>
        </>
      ) : (
        <ul class="results-list">
          {data.names.map((result) => (
            <li key={result.name} class="result-item">
              <h2 class="result-title">
                •{" "}
                {result.serverDefinedIsMisspellings ? (
                  <WordLink word={result.name} />
                ) : (
                  result.name
                )}{" "}
                <i class="result-title-description">
                  {result.count &&
                    `(${
                      // result.count
                      // format with Intl.NumberFormat
                      new Intl.NumberFormat("tr-TR").format(result.count)
                    } kişi)`}{" "}
                  {result.rank && `#${result.rank}`}
                </i>
              </h2>

              <section class="result-section">
                <h2 class="result-subtitle">Köken</h2>
                <li class="result-subitem">
                  {getGender(result)} adı
                  {result.definition ? ":" : ""} {result.languages.join(", ")}{" "}
                  {result.romanizedText}{" "}
                  {!result.isCertain && "? (kesin değil)"} {result.originalText}
                  {result.definition && ` "${result.definition}"`}
                  {!!result.reference.to.length && (
                    <>
                      {" "}
                      {result.note && "("}
                      {result.reference.isCertain && <>bakınız: </>}
                      <WordLinks
                        words={result.reference.to}
                        joinWith={
                          result.reference.isCompound ? " + " : undefined
                        }
                      />
                      {result.reference.isAbbreviation && <> (kısaltma)</>}
                      {!result.reference.isCertain && <>? (kesin değil)</>}
                      {result.note && ")"}
                    </>
                  )}
                  {!!result.sources.length && (
                    <>
                      {" – "}
                      <span>
                        <strong>{result.sources.join(", ")}</strong> kaynaklı
                        ad.
                      </span>
                    </>
                  )}
                  {!!result.origin.languages.length && (
                    <>
                      {" "}
                      (
                      <span>
                        {result.origin.languages.join(", ")}{" "}
                        <i>
                          {result.origin.romanizedText}{" "}
                          {result.origin.originalText}{" "}
                        </i>
                        {result.origin.definition &&
                          ` "${result.origin.definition}"`}
                      </span>
                      )
                    </>
                  )}
                </li>
                {result.note &&
                  replaceAbbrevations(formatSpecialChars(result.note))
                    .split(" * ")
                    .map((note, index) => (
                      <li
                        class="result-subitem mt-2"
                        key={index}
                        dangerouslySetInnerHTML={note}
                      />
                    ))}
              </section>
              {!!result.variants.length && (
                <section class="result-section">
                  <h2 class="result-subtitle">Farklı yazılışlar</h2>
                  <li class="result-subitem">
                    {result.variants
                      .sort((a, b) => b.count.total - a.count.total)
                      .map((variant, index) => (
                        <span key={variant.name}>
                          {variant.name} ({variant.count.total}){" "}
                          {index < result.variants.length - 1 && ", "}
                        </span>
                      ))}
                  </li>
                </section>
              )}
              {!!result.relatedNames.length && (
                <section class="result-section">
                  <h2 class="result-subtitle">Bu maddeye gönderenler</h2>
                  <WordLinks words={result.relatedNames} />
                </section>
              )}
              {!!result.region.locations.length && (
                <section class="result-section">
                  <h2 class="result-subtitle">Dağılım</h2>
                  <li class="result-subitem">
                    En çok{" "}
                    {result.region.locations
                      .map((location) => location.name)
                      .join(", ")}
                  </li>
                </section>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
});
