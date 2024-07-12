import { createHash } from "crypto";

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

// Function to get SHA-256 hash
function sha256(str: string) {
  return createHash("sha256").update(str).digest("hex");
}

// Function to get UUID based on input string and version
export function getUuid(name: string) {
  const hash = sha256(name);
  return toUUID(hash);
}

export function generateUUID(platform: QwikCityPlatform): string {
  const ip = ((platform.request as any)?.headers as any)?.[
    "cf-connecting-ip"
  ]?.toString();
  console.log("ip", ip);
  const uuid = getUuid(ip || Math.random().toString());
  console.log("uuid", uuid);
  return uuid;
}
