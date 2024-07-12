import getUuidByString from "uuid-by-string";

export function generateUUID(platform: QwikCityPlatform): string {
  const ip = ((platform.request as any)?.headers as any)?.[
    "cf-connecting-ip"
  ]?.toString();
  console.log("ip", ip);
  const uuid = getUuidByString(ip || Math.random().toString());
  console.log("uuid", uuid);
  return uuid;
}
