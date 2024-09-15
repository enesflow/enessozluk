import { component$ } from "@builder.io/qwik";
import ImgCatup from "~/../public/images/catup.png?jsx";
export const CatLookingUp = component$(() => {
  return (
    <div>
      <div class="pb-72 md:pb-96"></div>
      <ImgCatup
        alt="catup"
        class="absolute -bottom-4 left-0 h-72 w-auto shadow-lg dark:brightness-75 md:h-96"
      />
    </div>
  );
  // Thanks to https://unsplash.com/de/fotos/eine-graue-katze-sitzt-auf-einem-holztisch-QUPyMhbk4j0
});
