import type { LuggatResponse, LuggatResponseError } from "#/luggat";
import { convertToRoman } from "#helpers/roman";
import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { load } from "cheerio";

const LUGGAT_URL = "https://www.luggat.com/" as const;

export const LuggatDefiniton = component$<{ text: string }>(({ text }) => {
	const match = text.match(/\(Bak: (.+?)\)/);
	if (match) {
		const [fullMatch, linkText] = match;
		const beforeLink = text.split(fullMatch)[0];
		const afterLink = text.split(fullMatch)[1];

		return (
			<p>
				{beforeLink}
				<a href={`/search/${linkText}`}>{linkText}</a>
				{afterLink}
			</p>
		);
	}
	return <p>{text}</p>;
});

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
			const name = $(element)
				.find("h2.heading-5")
				.text()
				.trim()
				.replace(/\s+/g, " ");
			const definitions: string[] = [];

			// Process definitions inside <ol> lists
			$(element)
				.find("ol li")
				.each((_, li) => {
					const definition = $(li).text().trim();
					definitions.push(definition);
				});

			// If no <ol> list definitions found, check for other possible definitions
			if (definitions.length === 0) {
				const potentialDefinition = $(element)
					.contents()
					.filter((_, node) => node.type === "text")
					.text()
					.trim();
				if (potentialDefinition) {
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
									<li key={meaning}>
										<LuggatDefiniton text={meaning} />
									</li>
								))}
							</ul>
						</li>
					))}
				</ul>
			)}
		</>
	);
});
