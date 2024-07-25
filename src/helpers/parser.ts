export function joinTurkish(
  words: (string | null | undefined)[],
): string | null | undefined {
  // the words are joined by ,
  // and the last conjunction is replaced by "ve"
  if (words.length === 0) {
    return "";
  }
  if (words.length === 1) {
    return words[0];
  }
  return words.slice(0, -1).join(", ") + " ve " + words[words.length - 1];
}
