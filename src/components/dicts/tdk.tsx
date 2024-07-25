import type { TDKPackage } from "#/tdk";
import { convertToRoman } from "#helpers/roman";
import { component$, useSignal } from "@builder.io/qwik";
import { WordLinks } from "../WordLinks";
import { nonNullable } from "~/helpers/filter";
import { TDK_TTS_URL } from "~/helpers/dicts/url";
import Speaker from "../speaker";

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

const Play = component$<{ id: string | null | undefined }>(({ id }) => {
  const audio = useSignal<HTMLAudioElement>();
  return id ? (
    <button
      class="sesGetir"
      onClick$={() => {
        audio.value?.play();
      }}
    >
      <audio src={TDK_TTS_URL + id + ".wav"} ref={audio}></audio>
      <Speaker />
    </button>
  ) : (
    <></>
  );
});

export const TDKView = component$<{
  data: TDKPackage;
}>(({ data }) => {
  return (
    <>
      {"error" in data ? (
        <>
          <p class="error-message">{data.error}</p>
          {data.recommendations.length > 0 && (
            <>
              <div class="result-item result-subitem">
                Öneriler:{" "}
                <WordLinks
                  words={data.recommendations
                    .map((rec) => rec.madde)
                    .filter(
                      (value, index, self) => self.indexOf(value) === index,
                    )}
                />
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {" "}
          <ul class="results-list">
            {data.meanings.map((result, index) => (
              <li key={result.madde_id} class="result-item">
                <h2 class="result-title">
                  ({convertToRoman(index + 1)}) {result.madde}{" "}
                  {result.taki ? `-${result.taki}` : ""}
                  <i class="result-title-description">
                    {result.telaffuz && <> {result.telaffuz}</>}
                    {result.lisan && <> ({result.lisan})</>}
                  </i>{" "}
                  <Play id={data.tts} />
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
                        .map((word) => word.trim()),
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
