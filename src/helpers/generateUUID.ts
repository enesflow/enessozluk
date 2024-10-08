import type { RequestEvent } from "@builder.io/qwik-city";
import { sha256 } from "./sha256";

// Function to convert hash to UUID format
function toUUID(hash: string) {
  return [
    hash.substring(0, 8),
    hash.substring(8, 4),
    5 + hash.substring(12, 3),
    hash.substring(15, 4),
    hash.substring(19, 12),
  ].join("-");
}

// Function to get UUID based on input string and version
export async function getUuid(name: string) {
  const hash = await sha256(name);
  return toUUID(hash);
}

export async function generateUUID(
  clientConn?: RequestEvent<QwikCityPlatform>["clientConn"] | undefined,
): Promise<string> {
  const ip = clientConn?.ip;
  const uuid = getUuid(ip || Math.random().toString());
  return await uuid;
}
