import { component$ } from "@builder.io/qwik";
import { useLocation, type DocumentHead } from "@builder.io/qwik-city";
import { useNisanyanLoader } from "~/components/dicts/nisanyan";
import { TDKView, useTDKLoader } from "~/components/dicts/tdk";
import { NisanyanView } from "../../../components/dicts/nisanyan";
import { SearchBar } from "~/components/search";
import { LuggatView, useLuggatLoader } from "~/components/dicts/luggat";
export { useTDKLoader, useNisanyanLoader, useLuggatLoader };

export default component$(() => {
	const loc = useLocation();
	const tdk = useTDKLoader();
	const nisanyan = useNisanyanLoader();
	const luggat = useLuggatLoader();
	return (
		<>
			<h1>{loc.params.query}</h1>
			<SearchBar value={loc.params.query} />
			<h1>TDK Sonuçları:</h1>
			<TDKView data={tdk.value} />
			<h1>Nişanyan Sonunçarı:</h1>
			<NisanyanView data={nisanyan.value} />
			<h1>Luggat Sonuçları:</h1>
			<LuggatView data={luggat.value} />
		</>
	);
});

export const head: DocumentHead = {
	title: "Welcome to Qwik",
	meta: [
		{
			name: "description",
			content: "Qwik site description",
		},
	],
};
