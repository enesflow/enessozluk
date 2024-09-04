import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { LuArrowUpRight } from "@qwikest/icons/lucide";

export const ExternalLink = component$<{ href: string | undefined }>(
  ({ href }) => {
    return (
      <Link href={href} target="_blank" rel="noopener noreferrer">
        <LuArrowUpRight class="mb-0.5 inline w-auto" />
      </Link>
    );
  },
);

export default ExternalLink;
