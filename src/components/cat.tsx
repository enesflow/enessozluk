import { component$ } from "@builder.io/qwik";
import ImgCatup from "~/../public/images/catup.png?jsx";
export const CatLookingUp = component$(() => {
  return (
    <div class="h-72 md:h-96">
      <div class="pb-72 md:pb-96"></div>
      <ImgCatup
        alt="catup"
        class="bottom-fix absolute left-0 h-64 w-auto shadow-lg dark:brightness-75 md:h-[22rem]"
      />
    </div>
  );
  // Thanks to https://unsplash.com/de/fotos/eine-graue-katze-sitzt-auf-einem-holztisch-QUPyMhbk4j0
});
