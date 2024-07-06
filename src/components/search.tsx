import { component$, useSignal } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
export const SearchBar = component$<{ value?: string }>(({ value }) => {
	const nav = useNavigate();
	const query = useSignal(value ?? "");
	return (
		<>
			<form
				preventdefault:submit
				onSubmit$={() => nav(`/search/${query.value}`)}
			>
				<input
					type="text"
					placeholder="Search"
					bind:value={query}
					value={value}
				/>
				<button type="submit">Search</button>
			</form>
		</>
	);
});
