import type { QwikIntrinsicElements } from "@builder.io/qwik";
import {
  component$,
  createContextId,
  Slot,
  useContext,
  useSignal,
  useStyles$,
  useTask$,
} from "@builder.io/qwik";
import { routeLoader$, useLocation } from "@builder.io/qwik-city";
import { LuChevronRight } from "@qwikest/icons/lucide";
import { z } from "zod";
import styles from "~/styles/collapsable.css?inline";

function loadCollapsable(
  cookie: unknown | null,
): ReturnType<typeof collapsableStoreSchema.safeParse> {
  return collapsableStoreSchema.safeParse(cookie);
}
function setCollapsable(collapsed: CollapsableStore) {
  document.cookie = `collapsed=${JSON.stringify(collapsed)};path=/;max-age=31536000`;
}
// eslint-disable-next-line qwik/loader-location
export const useCollapsableLoader = routeLoader$<
  ReturnType<typeof loadCollapsable>
>((e) => {
  const cookie = e.cookie.get("collapsed")?.json();
  return loadCollapsable(cookie);
});

// TODO REMOVE THIS UNNECESSARY THING AND MAKE IT DYNAMIC
export const collapsableStoreSchema = z.object({
  tdk: z.boolean(),
  nisanyan: z.boolean(),
  luggat: z.boolean(),
  kubbealti: z.boolean(),
  benzer: z.boolean(),
  rhyme: z.boolean(),
  nnames: z.boolean(),
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
  nnames: false,
};

export const Collapsable = component$<
  QwikIntrinsicElements["div"] & {
    cId: keyof CollapsableStore;
    defaultClosed?: boolean | never;
  }
>(({ cId, defaultClosed: _defaultClosed, ...props }) => {
  useStyles$(styles);
  const defaultClosed = useSignal(_defaultClosed ?? false);
  const collapsed = useContext(CollapsableCTX);
  const loc = useLocation();
  // eslint-disable-next-line qwik/no-use-visible-task
  useTask$(({ track }) => {
    track(() => loc.isNavigating);
    /* // update defaultClosed when navigating
    console.log("NAVIGATING", defaultClosed.value, _defaultClosed);
    defaultClosed.value = _defaultClosed ?? false; */
    if (!loc.isNavigating) defaultClosed.value = _defaultClosed ?? false;
  });
  return (
    <div {...props} class="collapsable">
      <div class="flex items-start gap-1">
        <button
          onClick$={() => {
            if (defaultClosed.value) collapsed[cId] = false;
            else collapsed[cId] = !collapsed[cId];
            defaultClosed.value = false;
            setCollapsable(collapsed);
          }}
        >
          {/* <Chevron style={{ rotate: collapsed[cId] ? "0deg" : "90deg" }} /> */}
          <LuChevronRight
            style={{
              rotate: collapsed[cId] || defaultClosed.value ? "0deg" : "90deg",
            }}
            class="chevron mb-0.5 inline h-6 w-auto align-middle"
          />
        </button>
        <Slot name="header" />
      </div>
      {!collapsed[cId] && !defaultClosed.value && <Slot />}
    </div>
  );
});
