import { component$, Slot } from "@builder.io/qwik";
import type { LinkProps } from "@builder.io/qwik-city";
import { Link, useLocation } from "@builder.io/qwik-city";

export const LinkR = component$<LinkProps>((props) => {
  const loc = useLocation();
  // if the props.href is a relative path or now, we want the absolute path
  // using (example: https://google.com/ as the base)
  const href = props.href?.startsWith("/")
    ? `${loc.url.origin}${props.href}`
    : props.href;
  return (
    <Link {...props} href={href}>
      <Slot />
    </Link>
  );
});
