import type { Signal } from "@builder.io/qwik";
import { component$, useSignal, useStyles$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { getKubbealtiPage, kubbealtiLoader } from "~/helpers/dicts/kubbealti";
import { KUBBEALTI_TTS_URL } from "~/helpers/dicts/url";
import { convertToRoman } from "~/helpers/roman";
import type { KubbealtiError, KubbealtiPackage } from "~/types/kubbealti";
import { Play } from "../play";
import styles from "~/styles/kubbealti.css?inline";
import tookStyles from "~/styles/took.css?inline";

export function isKubbealtiFailed(
  data: KubbealtiPackage,
): data is KubbealtiError {
  return "serverDefinedReason" in data;
}

export const KubbealtiView = component$<{
  data: Signal<KubbealtiPackage>;
}>(({ data }) => {
  useStyles$(styles);
  useStyles$(tookStyles);
  const loc = useLocation();
  const kubbealtiPage = useSignal(getKubbealtiPage(loc.url));
  return (
    <>
      {isKubbealtiFailed(data.value) ? (
        <>
          <p class="error-message">{data.value.serverDefinedReason}</p>
        </>
      ) : (
        <>
          <p class="result-title-took">
            {data.value.totalElements} sonuç bulundu.
          </p>{" "}
          <ul class="results-list">
            {data.value.content[kubbealtiPage.value]?.map((result, index) => (
              <li key={result.id} class="result-item">
                <h2 class="result-title">
                  {data.value.content[kubbealtiPage.value]?.length === 1
                    ? "•"
                    : `(${convertToRoman(index + 1)})`}{" "}
                  {result.kelime}{" "}
                  <Play id={result.id.toString()} base={KUBBEALTI_TTS_URL} />
                </h2>
                <ul class="results-list">
                  <div dangerouslySetInnerHTML={result.anlam} />
                </ul>
              </li>
            ))}
          </ul>
          {/* a page selector */}
          {data.value.totalPages > 1 && (
            <select
              onChange$={async (_, e) => {
                const value = Number.parseInt(e.value) || 1;
                const url = loc.url;
                url.searchParams.set("kubbealtiPage", value.toString());
                window.history.replaceState(null, "", url.toString());
                if (!(value in data.value.content))
                  data.value = await kubbealtiLoader(value);
                kubbealtiPage.value = value;
              }}
              class="mb-4"
            >
              {Array.from({ length: data.value.totalPages }, (_, i) => (
                <option
                  key={i}
                  value={i + 1}
                  selected={i + 1 === kubbealtiPage.value}
                >
                  {"Kubbealtı Sayfa " + (i + 1).toString()}
                </option>
              ))}
            </select>
          )}
        </>
      )}
    </>
  );
});
