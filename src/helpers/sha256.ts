export async function sha256(ascii: string): Promise<string> {
  // using crypto.subtle for cloudflare workers
  const bytes = new TextEncoder().encode(ascii);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
