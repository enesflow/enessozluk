import { component$, useSignal, useStyles$, useTask$ } from "@builder.io/qwik";
import { server$, useLocation } from "@builder.io/qwik-city";
import OpenAI from "openai";
import Spark from "~/components/spark";
import type { PerplexityCompletionChunk } from "~/helpers/perplexity/perplexity";
import button_styles from "~/styles/button.css?inline";
import styles from "~/styles/ai.css?inline";
import Spinner from "~/components/spinner";
import { loadSharedMap } from "~/helpers/request";

function preprocess_text_server(text: string) {
  // remove any number that is enclosed in square brackets [123] and also remove the brackets
  text = text.replaceAll(/\[[0-9]+\]/g, "");
  return text;
}

function process_text_client(text: string) {
  // make any bold tags a <strong> tag, we need to find all the "**" first and iterate one by one
  let index = 0;
  // if the index is divisible by 2, it means we are at the start of a bold tag
  // if the index is divisible by 2 + 1, it means we are at the end of a bold tag
  while (text.indexOf("**", index) !== -1) {
    const start = text.indexOf("**", index);
    const end = text.indexOf("**", start + 2);
    if (end === -1) break; // no closing tag found
    text =
      text.slice(0, start) +
      "<strong>" +
      text.slice(start + 2, end) +
      "</strong>" +
      text.slice(end + 2);
    index = end + 2;
  }
  // remove any remaining "**" tags
  text = text.replaceAll("**", "");
  return text;
}

const getAIResponse = server$(async function* (word: string) {
  const sharedMap = loadSharedMap(this);
  const client = new OpenAI({
    apiKey:
      process.env.PERPLEXITY_API_KEY || this.env.get("PERPLEXITY_API_KEY"),
    baseURL: "https://api.perplexity.ai",
  });

  const sources = new Set<string>(); // Using Set for unique sources
  console.log(
    "Running AI response for word:",
    word,
    "(",
    sharedMap.query.rawDecoded,
    ")",
  );

  try {
    const stream = (await client.chat.completions.create({
      model: "sonar",
      messages: [
        {
          role: "system",
          content: `Your name is EnesAI. You are a helpful assistant that is only allowed to answer in Turkish. 
            Your sole purpose is to give the meaning of the word/phrase in Turkish.`,
        },
        {
          role: "user",
          content: `Türkçe'de "${sharedMap.query.rawDecoded}" kelimesinin anlamını ver. Başka bir şey istemiyorum.`,
        },
      ],
      stream: true,
    })) as unknown as AsyncIterable<PerplexityCompletionChunk>;

    for await (const chunk of stream) {
      yield {
        text: preprocess_text_server(chunk.choices[0]?.delta?.content || ""),
        sources: undefined,
      };
      // Handle citations (sources)
      if (chunk.citations) {
        chunk.citations.forEach((url) => sources.add(url));
      }
    }

    yield { text: "", sources: Array.from(sources) };
    return "Finished";
  } catch (error) {
    console.error("Streaming error:", error);
    yield { text: "⚠️ Service unavailable.", sources: [] };
    throw error;
  }
});

export const AIResult = component$<{
  word: string;
}>(({ word }) => {
  useStyles$(styles);
  useStyles$(button_styles);
  const loc = useLocation();
  const message = useSignal("");
  const sourceList = useSignal<string[]>([]);
  useTask$(({ track }) => {
    track(() => loc.isNavigating);
    message.value = "";
    sourceList.value = [];
  });
  const isLoading = useSignal(false);

  return (
    <div>
      <button
        type="submit"
        class={`generic-button w-48 gap-2 ${isLoading.value ? "cursor-not-allowed bg-red-600" : ""}`}
        onClick$={async () => {
          isLoading.value = true;
          message.value = "";
          sourceList.value = [];
          const response = await getAIResponse(word);
          for await (const chunk of response) {
            message.value += chunk.text;
            if (chunk.sources) {
              sourceList.value = [...sourceList.value, ...chunk.sources];
            }
          }
          isLoading.value = false;
        }}
      >
        {isLoading.value ? (
          <span>
            <Spinner />{" "}
          </span>
        ) : (
          <>
            <Spark />
            {message.value.length === 0 ? "Yapay zekaya sor" : "Yeniden sor"}
          </>
        )}
      </button>

      <p
        dangerouslySetInnerHTML={process_text_client(message.value)}
        class="result-item"
      />
    </div>
  );
});
