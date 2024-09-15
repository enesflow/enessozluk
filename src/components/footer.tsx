import { component$, useStyles$ } from "@builder.io/qwik";
import styles from "~/styles/footer.css?inline";
import { Link } from "@builder.io/qwik-city";
import { LuMail } from "@qwikest/icons/lucide";
import { SiGithub } from "@qwikest/icons/simpleicons";

export const Footer = component$(() => {
  useStyles$(styles);
  // make sure it is at the bottom of the page using tw classes
  return (
    <div class="footer bottom-fix">
      <Link href="mailto:mail@enesin.xyz shadow-2xl">
        <LuMail class="icon" />
        İletişim
      </Link>
      <Link href="https://github.com/enesflow/" class="shadow-2xl">
        <SiGithub class="icon" />
        Github
      </Link>
      <Link href="https://siir.enesin.xyz" class="obsidian shadow-2xl">
        🕊️ Enes Şiir
      </Link>
    </div>
    // but make sure it is not "fixed" so that it is at the bottom of the content,
    // so use
  );
});
