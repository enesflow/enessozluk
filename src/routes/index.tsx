import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { SearchBar } from "~/components/search";

export default component$(() => {
	return (
		<>
			<h1>Welcome to EnesSozluk 📕</h1>
			<SearchBar />
		</>
	);
});

export const head: DocumentHead = {
	title: "Welcome to EnesSozluk",
	meta: [
		{
			name: "description",
			content: "EnesSozluk site description",
		},
	],
};
