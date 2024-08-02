import type { RequestEventBase } from "@builder.io/qwik-city";
import type { D1Database } from "@cloudflare/workers-types";
import { z } from "zod";
import { sha256 } from "./sha256";

const CacheInputSchema = z.object({
  key: z.string(),
  data: z.string(),
});

const CacheSchema = CacheInputSchema.extend({
  key: z.string(),
  data: z.string(),
  time: z.number(),
  hash: z.string(),
});

export type CacheInput = z.infer<typeof CacheInputSchema>;
export type Cache = z.infer<typeof CacheSchema>;

export function getDB(e: RequestEventBase): D1Database | undefined {
  if (e.sharedMap.has("db")) {
    return e.sharedMap.get("db") as D1Database;
  }
  const DB = e.platform.env?.DB as D1Database;
  e.sharedMap.set("db", DB);
  return DB;
}

export async function getCacheByKey(
  e: RequestEventBase,
  key: string,
): Promise<Cache | null> {
  const db = getDB(e);
  if (!db) return null;
  const result = await db
    .prepare("SELECT * from cache WHERE key = ?")
    .bind(key)
    .first();
  if (!result) return null;
  return CacheSchema.parse(result);
}

export async function setCache(e: RequestEventBase, input: CacheInput) {
  const db = getDB(e);
  if (!db) return;
  const cache: Cache = {
    ...input,
    time: Date.now(),
    hash: await sha256(input.data),
  };
  await db
    .prepare("INSERT INTO cache (key, data, time, hash) VALUES (?, ?, ?, ?)")
    .bind(cache.key, cache.data, cache.time, cache.hash)
    .run();
}

export async function updateCache(e: RequestEventBase, input: CacheInput) {
  const db = getDB(e);
  if (!db) return;
  const cache: Cache = {
    ...input,
    time: Date.now(),
    hash: await sha256(input.data),
  };
  await db
    .prepare("UPDATE cache SET data = ?, time = ?, hash = ? WHERE key = ?")
    .bind(cache.data, cache.time, cache.hash, cache.key)
    .run();
}

export async function deleteCache(e: RequestEventBase, key: string) {
  const db = getDB(e);
  if (!db) return;
  await db.prepare("DELETE FROM cache WHERE key = ?").bind(key).run();
}
