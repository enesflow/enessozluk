import { component$ } from "@builder.io/qwik";
import { LinkR } from "./linkWithRedirect";

export const Recommendations = component$<{
  words: string[];
}>(({ words }) => {
  return (
    <>
      {words.map((rec, index) => (
        <>
          <LinkR href={`/search/${rec}`} key={rec}>
            {rec}
          </LinkR>
          {index < words.length - 1 ? ", " : "."}
        </>
      ))}
    </>
  );
});

export default Recommendations;
