import { component$, Slot } from "@builder.io/qwik";

export const Box = component$<{ class?: string }>(({ class: className }) => {
  return (
    <div class={`flex w-full justify-center ${className}`}>
      <div class="new-features-wrapper nice-w redish-tinted-background">
        <Slot />
      </div>
    </div>
  );
});
