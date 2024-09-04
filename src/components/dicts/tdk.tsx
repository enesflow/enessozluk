import type { TDKPackage, TDKResponseError } from "#/tdk";
import { romanOptional } from "#helpers/roman";
import { component$ } from "@builder.io/qwik";
import { TDK_TTS_URL } from "~/helpers/dicts/url";
import { nonNullable } from "~/helpers/filter";
import { Play } from "../play";
import { WordLinks } from "../WordLinks";

const TDK_LINK_DET = "► " as const;

export function isOutLink(word: string): {
  outLink: boolean;
  cleanWords: string[];
} {
  function romanToFront(word: string): string {
    // example:
    // input: heykel (I)
    // output: (I) heykel
    const words = word.split(" ");
    if (words.length < 2) {
      return word;
    }
    const lastWord = words[words.length - 1];
    if (lastWord.startsWith("(") && lastWord.endsWith(")")) {
      return `${lastWord} ${words.slice(0, -1).join(" ")}`;
    }
    return word;
  }
  if (word.startsWith(TDK_LINK_DET)) {
    return {
      outLink: true,
      cleanWords: word.slice(TDK_LINK_DET.length).split(", ").map(romanToFront),
    };
  }
  // To make sense of this check, check queries "server" and "z kuşağı" on TDK
  if (word.startsWith("343 ")) {
    return {
      outLink: true,
      cleanWords: word.slice(4).split(", ").map(romanToFront),
    };
  }

  return {
    outLink: false,
    cleanWords: [],
  };
}

/* export function isTDKFailed(data: TDKPackage): boolean {
  return "error" in data;
} */
// MAKE IT TYPESAFE, IF TRUE then return while assuring there is "error" in data in Typescript

export function isTDKFailed(data: TDKPackage): data is TDKResponseError {
  return "error" in data;
}

export function getTDKRecommendations(data: TDKResponseError): string[] {
  return data.recommendations.map((rec) => rec.madde);
}

export const TDKView = component$<{
  data: TDKPackage;
}>(({ data }) => {
  return (
    <>
      {isTDKFailed(data) ? (
        <>
          <p class="error-message">{data.error}</p>
        </>
      ) : (
        <>
          {" "}
          <ul class="results-list">
            {data.meanings.map((result, index) => (
              <li key={result.madde_id} class="result-item">
                <h2 class="result-title">
                  {romanOptional(index, data.meanings.length)}
                  {result.madde} {result.taki ? `-${result.taki}` : ""}
                  <i class="result-title-description">
                    {result.telaffuz && <> {result.telaffuz}</>}
                    {result.lisan && <> ({result.lisan})</>}
                  </i>{" "}
                  <Play id={data.tts} base={TDK_TTS_URL} />
                </h2>
                <ul class="results-list">
                  {result.anlamlarListe?.map((meaning) => (
                    <li
                      key={meaning.anlam_id}
                      class="result-subitem result-description"
                    >
                      <strong>{meaning.serverDefinedPreText} </strong>
                      {isOutLink(meaning.anlam).outLink ? (
                        <WordLinks
                          words={isOutLink(meaning.anlam).cleanWords}
                        />
                      ) : (
                        meaning.anlam
                      )}

                      <ul>
                        {meaning.orneklerListe?.map((example) => (
                          <li key={example.ornek_id} class="result-quote">
                            <p>
                              {/*  "{example.ornek}"{" "} */}
                              {/* split example.ornek into multiple lines by "/" */}
                              "
                              {example.ornek?.split("/").map((line, index) => (
                                <>
                                  {line}
                                  {index <
                                    (example.ornek?.split("/").length ?? 0) -
                                      1 && <br />}
                                </>
                              ))}
                              "
                              <br />
                              {!!example.yazar
                                ?.map((a) => a.tam_adi)
                                .filter(nonNullable).length && (
                                <em class="ml-4">
                                  {example.yazar
                                    .map((yazar) => yazar.tam_adi)
                                    .join(", ")}
                                </em>
                              )}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          {data.meanings
            .map((result) =>
              result.birlesikler?.split(", ").map((word) => word.trim()),
            )
            .flat()
            .filter(Boolean).length > 0 && (
            <section class="result-section">
              <h2 class="result-subtitle">Birleşik sözcükler</h2>
              <WordLinks
                words={
                  data.meanings
                    .map((result) =>
                      result.birlesikler
                        ?.split(", ")
                        // remove all text inside < > brackets
                        .map((word) => word.replace(/<[^>]*>/g, "").trim()),
                    )
                    .flat()
                    .filter(Boolean) as string[]
                }
              />
            </section>
          )}
        </>
      )}
    </>
  );
});
