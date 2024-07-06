import type { RequestHandler } from "@builder.io/qwik-city";

export const onRequest: RequestHandler = async ({
	url,
	params,
	redirect,
	next,
}) => {
	const query = params.query;
	const lower = query.toLocaleLowerCase("tr");
	if (!query.endsWith("-")) {
		await next();
		return;
	}
	// if the query ends with a hyphen, do this
	// this is for turkish words
	// get the last vowel, check if it's a back vowel or a front vowel (a, ı, o, u or e, i, ö, ü)

	const lastVowel = lower.match(/[aeıioöuü]/gi)?.slice(-1);
	// if it's a back vowel, add "mak" to the end
	// if it's a front vowel, add "mek" to the end
	if (lastVowel) {
		const [vowel] = lastVowel;
		const noHyphen = lower.slice(0, -1);
		let toAdd = "";
		if ("eiüö".includes(vowel.toLowerCase())) {
			toAdd = "mek";
		} else if ("aıou".includes(vowel.toLowerCase())) {
			toAdd = "mak";
		}
		const to = `${url.origin}/search/${encodeURIComponent(noHyphen + toAdd)}/`;
		throw redirect(301, to);
	}
	/* if (query !== lower) {
		throw redirect(301, `/search/${lower}`);
	} */ // Don't need this for now

	await next();
};
