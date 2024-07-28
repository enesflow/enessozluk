export function unq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
