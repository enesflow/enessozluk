import { component$, useStyles$ } from "@builder.io/qwik";
import styles from "~/styles/speaker.css?inline";

export const SPEAKER_DELAY = 0.05 as const;

export const Speaker = component$<{ duration?: number }>(({ duration }) => {
  useStyles$(styles);
  const seconds = duration && `${duration + SPEAKER_DELAY}s`;
  return (
    <>
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
        class="speaker inline h-5 w-auto align-middle"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path
          d="M15.54 8.46a5 5 0 0 1 0 7.07"
          style={duration ? `animation: speaker-first ${seconds} linear;` : ""}
        />
        <path
          d="M19.07 4.93a10 10 0 0 1 0 14.14"
          style={duration ? `animation: speaker-last ${seconds} linear;` : ""}
        />
      </svg>
    </>
  );
});

export default Speaker;
