export async function to<T, E = Error>(
  promise: Promise<T>,
): Promise<[E | null, T | null]> {
  try {
    const result = await promise;
    return [null, result];
  } catch (error) {
    return [error as E, null];
  }
}
