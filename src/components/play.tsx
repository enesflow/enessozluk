import { component$, useSignal } from "@builder.io/qwik";
import Speaker, { SPEAKER_DELAY } from "~/components/speaker";

export const Play = component$<{ base: string; id: string | null | undefined }>(
  ({ base, id }) => {
    const audio = useSignal<HTMLAudioElement>();
    const playing = useSignal(false);

    return id ? (
      <button
        onClick$={() => {
          console.log("I am clicked");
          if (playing.value) return;
          if (audio.value) {
            playing.value = true;
            audio.value.currentTime = 0;
            audio.value.play();
            setTimeout(
              () => (playing.value = false),
              (audio.value.duration + SPEAKER_DELAY) * 1000,
            );
          }
        }}
      >
        <audio
          src={base + id + ".wav"}
          ref={audio}
          onPlay$={() => (playing.value = true)}
          preload="auto"
        />
        <Speaker duration={playing.value ? audio.value?.duration : undefined} />
      </button>
    ) : (
      <></>
    );
  },
);
