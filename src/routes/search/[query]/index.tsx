import { component$ } from "@builder.io/qwik";
import { type DocumentHead } from "@builder.io/qwik-city";
import { useNisanyanLoader } from "~/components/dicts/nisanyan";
import { TDKView, useTDKLoader } from "~/components/dicts/tdk";
import { NisanyanView } from "../../../components/dicts/nisanyan";
import { SearchBar } from "~/components/search";
export { useTDKLoader, useNisanyanLoader };

export default component$(() => {
	const tdk = useTDKLoader();
	const nisanyan = useNisanyanLoader();
	return (
		<>
			<SearchBar />
			<h1>TDK Sonuçları:</h1>
			<TDKView data={tdk.value} />
			<h1>Nişanyan Sonunçarı:</h1>
			<NisanyanView data={nisanyan.value} />
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
