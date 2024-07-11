import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

export const Recommendations = component$<{
  words: string[];
}>(({ words }) => {
  return (
    <>
      {words.map((rec, index) => (
        <>
          <Link href={`/search/${rec}`} key={rec}>
            {rec}
          </Link>
          {index < words.length - 1 ? ", " : "."}
        </>
      ))}
    </>
  );
});

export default Recommendations;
