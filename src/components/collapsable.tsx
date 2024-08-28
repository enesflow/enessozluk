import type { QwikIntrinsicElements } from "@builder.io/qwik";
import {
  component$,
  createContextId,
  Slot,
  useContext,
} from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { z } from "zod";

function loadCollapsable(
  cookie: unknown | null,
): ReturnType<typeof collapsableStoreSchema.safeParse> {
  return collapsableStoreSchema.safeParse(cookie);
}
function setCollapsable(collapsed: CollapsableStore) {
  document.cookie = `collapsed=${JSON.stringify(collapsed)};path=/`;
}
// eslint-disable-next-line qwik/loader-location
export const useCollapsableLoader = routeLoader$<
  ReturnType<typeof loadCollapsable>
>((e) => {
  const cookie = e.cookie.get("collapsed")?.json();
  return loadCollapsable(cookie);
});

export const collapsableStoreSchema = z.object({
  tdk: z.boolean(),
  nisanyan: z.boolean(),
  luggat: z.boolean(),
  kubbealti: z.boolean(),
  benzer: z.boolean(),
  rhyme: z.boolean(),
});

export type CollapsableStore = z.infer<typeof collapsableStoreSchema>;
export const CollapsableCTX = createContextId<CollapsableStore>("collapsable");

export const DEFAULT_COLLAPSABLE: CollapsableStore = {
  tdk: false,
  nisanyan: false,
  luggat: false,
  kubbealti: false,
  benzer: false,
  rhyme: false,
};

const Chevron = component$<QwikIntrinsicElements["svg"]>(({ ...props }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="chevron mb-0.5 inline h-6 w-auto align-middle"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
});

export const Collapsable = component$<
  QwikIntrinsicElements["div"] & {
    cId: keyof CollapsableStore;
  }
>(({ cId, ...props }) => {
  const collapsed = useContext(CollapsableCTX);
  return (
    <div {...props}>
      <div class="flex items-start gap-1">
        <button
          onClick$={() => {
            collapsed[cId] = !collapsed[cId];
            setCollapsable(collapsed);
          }}
        >
          <Chevron style={{ rotate: collapsed[cId] ? "0deg" : "90deg" }} />
        </button>
        <Slot name="header" />
      </div>
      {!collapsed[cId] && <Slot />}
    </div>
  );
});
