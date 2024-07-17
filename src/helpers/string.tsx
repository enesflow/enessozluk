export function removeNumbersAtEnd(text: string): string {
  return text.replace(/\d+$/, "");
}

export function removeNumbersInWord(text: string): string {
  return text.replace(/\d+/g, "");
}
