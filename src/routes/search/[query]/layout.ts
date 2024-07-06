import type { RequestHandler } from "@builder.io/qwik-city";

export const onRequest: RequestHandler = async ({ params, redirect, next }) => {
	const query = params.query;
	if (!query.endsWith("-")) {
		await next();
		return;
	}
	// if the query ends with a hyphen, do this
	// this is for turkish words
	// get the last vowel, check if it's a back vowel or a front vowel (a, ı, o, u or e, i, ö, ü)

	const lastVowel = query.match(/[aeıioöuü]/gi)?.slice(-1);
	// if it's a back vowel, add "mak" to the end
	// if it's a front vowel, add "mek" to the end
	// if no vowel is found, dont change the query
	if (lastVowel) {
		console.log(`Last vowel: ${lastVowel}`);
		const [vowel] = lastVowel;
		const noHyphen = query.slice(0, -1);
		if ("eiüö".includes(vowel.toLowerCase())) {
			console.log("Redirecting to", `/search/${noHyphen}mek`);
			throw redirect(301, `/search/${noHyphen}mek`);
		} else if ("aıou".includes(vowel.toLowerCase())) {
			console.log("Redirecting to", `/search/${noHyphen}mak`);
			throw redirect(301, `/search/${noHyphen}mak`);
		}
	}
	await next();
};
