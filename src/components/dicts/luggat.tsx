import type { LuggatResponse, LuggatResponseError } from "#/luggat";
import { convertToRoman } from "#helpers/roman";
import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { load } from "cheerio";

const LUGGAT_URL = "https://www.luggat.com/" as const;
// eslint-disable-next-line qwik/loader-location
export const useLuggatLoader = routeLoader$<
	LuggatResponse | LuggatResponseError
>(async ({ params }) => {
	try {
		const url = `${LUGGAT_URL}${params.query}`;
		const response = await fetch(url);
		const html = await response.text();
		const $ = load(html);
		const words: LuggatResponse["words"] = [];

		$(".arama-sonucu-div").each((index, element) => {
			console.log(`Processing element ${index}`);
			const name = $(element)
				.find("h2.heading-5")
				.text()
				.trim()
				.replace(/\s+/g, " ");
			console.log(`Found name: ${name}`);
			const definitions: string[] = [];

			// Process definitions inside <ol> lists
			$(element)
				.find("ol li")
				.each((_, li) => {
					const definition = $(li).text().trim();
					console.log(`Found definition: ${definition}`);
					definitions.push(definition);
				});

			// If no <ol> list definitions found, check for other possible definitions
			if (definitions.length === 0) {
				console.log("Could not find any definitions in <ol> list");
				const potentialDefinition = $(element)
					.contents()
					.filter((_, node) => node.type === "text")
					.text()
					.trim();
				console.log(
					`Found alternative definition: ${potentialDefinition}`
				);
				if (potentialDefinition) {
					console.log(
						`Found alternative definition: ${potentialDefinition}`
					);
					definitions.push(potentialDefinition);
				}
			}

			if (name && definitions.length) {
				words.push({ name, definitions });
			}
		});
		if (words.length === 0) {
			return { isUnsuccessful: true };
		}

		return { isUnsuccessful: false, words };
	} catch (error) {
		console.error("Error parsing HTML:", error);
		return { isUnsuccessful: true };
	}
});

export const LuggatView = component$<{
	data: LuggatResponse | LuggatResponseError;
}>(({ data }) => {
	return (
		<>
			{data.isUnsuccessful ? (
				<p>Sonuç bulunamadı</p>
			) : (
				<ul>
					{data.words.map((word, index) => (
						<li key={word.name}>
							<h2>
								({convertToRoman(index + 1)}) {word.name}
							</h2>
							<ul>
								{word.definitions.map((meaning) => (
									<li key={meaning}>{meaning}</li>
								))}
							</ul>
						</li>
					))}
				</ul>
			)}
		</>
	);
});
