import { component$ } from "@builder.io/qwik";
import { LuCheckCircle2, LuXCircle } from "@qwikest/icons/lucide";
export const HeaderIcon = component$<{ show: boolean; failed: boolean }>(
  ({ show, failed }) => {
    return (
      <>
        {failed ? (
          <>
            <LuXCircle class="mb-0.5 inline w-auto text-red-500" />
          </>
        ) : (
          <>{show && <LuCheckCircle2 class="mb-0.5 inline w-auto" />}</>
        )}
      </>
    );
  },
);
