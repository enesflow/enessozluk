import type { TDKResponse, TDKResponseError } from "#/tdk";
import { component$ } from "@builder.io/qwik";
import { routeLoader$, Link } from "@builder.io/qwik-city";
import { convertToRoman } from "#helpers/roman";

const TDK_LINK_DET = "► " as const;
const TDK_URL = "https://sozluk.gov.tr/gts?ara=" as const;
// eslint-disable-next-line qwik/loader-location
export const useTDKLoader = routeLoader$<TDKResponse | TDKResponseError>(
	async ({ params }) => {
		const url = `${TDK_URL}${params.query}`;
		const response = await fetch(url);
		const data = (await response.json()) as TDKResponse | TDKResponseError;
		return data;
	}
);

export const TDKView = component$<{
	data: TDKResponse | TDKResponseError;
}>(({ data }) => {
	return (
		<>
			{"error" in data ? (
				<p>{data.error}</p>
			) : (
				<ul>
					{data.map((result, index) => (
						<li key={result.madde_id}>
							<h2>
								({convertToRoman(index + 1)}) {result.madde}{" "}
								{result.taki ? `-${result.taki}` : ""}
							</h2>
							<ul>
								{result.anlamlarListe.map((meaning) => (
									<li key={meaning.anlam_id}>
										{meaning.anlam.startsWith(
											TDK_LINK_DET
										) ? (
											<Link
												href={`/search/${meaning.anlam.slice(
													TDK_LINK_DET.length
												)}`}
											>
												{meaning.anlam}
											</Link>
										) : (
											<p>{meaning.anlam}</p>
										)}
										<ul>
											{meaning.orneklerListe?.map(
												(example) => (
													<li key={example.ornek_id}>
														<p>
															"{example.ornek}"{" "}
															<em>
																{example.yazar
																	?.map(
																		(
																			yazar
																		) =>
																			yazar.tam_adi
																	)
																	.join(", ")}
															</em>
														</p>
													</li>
												)
											)}
										</ul>
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
