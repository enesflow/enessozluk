import { component$, useSignal } from "@builder.io/qwik";
import Speaker, { SPEAKER_DELAY } from "~/components/speaker";
export const Play = component$<{ base: string; id: string | null | undefined }>(
  ({ base, id }) => {
    const audio = useSignal<HTMLAudioElement>();
    const playing = useSignal(false);
    return id ? (
      <button
        onClick$={() => {
          if (playing.value) return;
          const audioElement = audio.value;
          if (audioElement) {
            playing.value = true;
            audioElement.currentTime = 0;
            audioElement.play();
            setTimeout(
              () => (playing.value = false),
              (audioElement.duration + SPEAKER_DELAY) * 1000,
            );
          }
        }}
      >
        <audio
          src={base + id + ".wav"}
          ref={audio}
          onPlay$={() => (playing.value = true)}
        />
        <Speaker duration={playing.value ? audio.value?.duration : undefined} />
      </button>
    ) : (
      <></>
    );
  },
);