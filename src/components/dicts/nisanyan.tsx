import type { NisanyanResponse, NisanyanResponseError } from "#/nisanyan";
import { generateUUID, convertToRoman } from "#helpers/roman";
import { component$ } from "@builder.io/qwik";
import { Link, routeLoader$ } from "@builder.io/qwik-city";

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
} as const; // TODO: Complete the list
const NISANYAN_NO_RESULT = "Sonuç bulunamadı" as const;

function convertDate(date: string): string {
	if (date.startsWith("<")) {
		return `${date.slice(1)} yılından önce`;
	}
	return date;
}
function removeNumbersAtEnd(text: string): string {
	return text.replace(/\d+$/, "");
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
	for (const word of data.words) {
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
		const pattern = new RegExp(
			`(?<=^|\\s|>)${abbreviation}(?=\\s|$|<)`,
			"g"
		);
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
	return data;
});

export const WordLinks = component$<{ words: string[] }>(({ words }) => {
	return (
		<>
			{words.map((word, index) => (
				<span key={word}>
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
				<p>{NISANYAN_NO_RESULT}</p>
			) : (
				<ul>
					{data.words.map((word, index) => (
						<li key={word._id}>
							<h2>
								({convertToRoman(index + 1)}){" "}
								{removeNumbersAtEnd(word.name)}
							</h2>
							<section>
								<h2>Köken</h2>
								{word.etymologies.map((etymology, index) => (
									<ul key={index}>
										<li>
											<strong>
												{etymology.languages[0].name}
											</strong>
											<span>
												{" "}
												{etymology.romanizedText}
											</span>
											<span>
												{" "}
												«{etymology.definition}»
											</span>
											<span>
												{" "}
												{etymology.relation.text}
											</span>
										</li>
									</ul>
								))}
								{word.references.length > 0 && (
									<p>
										Daha fazla bilgi için{" "}
										<WordLinks
											words={word.references.map(
												(ref) => ref.name
											)}
										/>{" "}
										maddelerine bakınız.
									</p>
								)}
							</section>
							{word.note && (
								<section>
									<h2>Ek açıklama</h2>
									<p
										dangerouslySetInnerHTML={replaceAbbrevations(
											formatSpecialChars(word.note),
											data
										)}
									/>
								</section>
							)}
							{word.similarWords && (
								<section>
									<h2>Benzer sözcükler</h2>
									<WordLinks words={word.similarWords} />
								</section>
							)}
							{word.referenceOf && (
								<section>
									<h2>Bu maddeye gönderenler</h2>
									<WordLinks
										words={word.referenceOf.map(
											(ref) => ref.name
										)}
									/>
								</section>
							)}
							{!word.histories ? (
								<p>
									<i>Henüz tarihçe eklenmemiş.</i>
								</p>
							) : (
								<section>
									<h2>
										Tarihçe (tespit edilen en eski Türkçe
										kaynak ve diğer örnekler)
									</h2>
									{word.histories.map((history, index) => (
										<div key={index}>
											<p>
												<strong>
													{history.language?.name}
												</strong>
												<span>
													{" "}
													[
													{history.source?.book ??
														history.source?.name ??
														"Bilinmiyor"}
													,{" "}
													{convertDate(history.date)}]
												</span>
											</p>
											<p
												dangerouslySetInnerHTML={
													"&emsp;" +
													formatSpecialChars(
														history.quote
													)
												}
											/>
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
