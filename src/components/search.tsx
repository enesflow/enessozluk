import { component$, useSignal } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
export const SearchBar = component$(() => {
	const nav = useNavigate();
	const query = useSignal("");
	return (
		<>
			<h1>Welcome to EnesSozluk 📕</h1>
			<form
				preventdefault:submit
				onSubmit$={() => nav(`/search/${query.value}`)}
			>
				<input type="text" placeholder="Search" bind:value={query} />
				<button type="submit">Search</button>
			</form>
		</>
	);
});
