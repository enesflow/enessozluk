import { component$ } from "@builder.io/qwik";
import ImgCatup from "~/../public/images/catup.png?jsx";
export const CatLookingUp = component$(() => {
  return (
    <div>
      <div class="pb-96" />
      <ImgCatup
        alt="catup"
        class="absolute -bottom-4 left-0 h-96 w-auto shadow-lg dark:brightness-75"
      />
    </div>
  );
  // Thanks to https://unsplash.com/de/fotos/eine-graue-katze-sitzt-auf-einem-holztisch-QUPyMhbk4j0
});
