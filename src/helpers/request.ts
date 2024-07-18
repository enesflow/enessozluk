import type { Dicts } from "#/dicts";
import type { SharedMap } from "#/request";
import type { RequestEventBase } from "@builder.io/qwik-city";
import type { ZodSchema, z } from "zod";
import { LuggatPackageSchema } from "~/types/luggat";
import { TDKPackageSchema } from "~/types/tdk";

export function loadSharedMap(e: RequestEventBase) {
  const data = e.sharedMap.get("data");
  if (!data) {
    throw new Error("'data' not found in sharedMap");
  }
  return data as SharedMap;
}

export function setSharedMapResult<T>(
  e: RequestEventBase,
  dict: Dicts,
  data: T,
): T {
  const sharedMap = loadSharedMap(e);
  (sharedMap.result as any)[dict] = data; // TODO: change this
  e.sharedMap.set("data", sharedMap);
  return data;
}

function buildError(response: Response) {
  if (!response.ok) {
    return new Error(
      `Failed to fetch ${response.url} with status ${response.status} (${response.statusText}): ${response.text()}`,
    );
  }
  return undefined;
}

/**
 * Fetches data from an API endpoint.
 *
 * @param url - The URL of the API endpoint.
 * @param returnType - The expected return type of the API response. Defaults to "json".
 * @param init - Optional request initialization options.
 * @returns A promise that resolves to the API response based on the specified return type.
 */
export async function fetchAPI<T extends "json" | "html" = "json">(
  url: string,
  returnType: T = "json" as T,
  init?: RequestInit,
): Promise<
  | {
      data: T extends "json" ? unknown : string;
      success: true;
      code: number;
      response: Response;
    }
  | {
      success: false;
      error: Error;
      code: number;
      response: Response;
    }
> {
  const response = await fetch(url, init);
  const error = buildError(response);
  if (error) {
    // throw error
    return {
      success: false,
      code: response.status,
      error,
      response,
    };
  }
  /* return returnType === "json" ? res.json() : res.text(); */
  return {
    success: true,
    code: response.status,
    data: returnType === "json" ? await response.json() : await response.text(),
    response,
  };
}

const Packages: Record<Dicts, ZodSchema> = {
  tdk: TDKPackageSchema,
  luggat: LuggatPackageSchema,
  "nisanyan-affix": TDKPackageSchema, // TODO: change this
  "tdk-rec": TDKPackageSchema, // TODO: change this
  benzer: TDKPackageSchema, // TODO: change this
  nisanyan: TDKPackageSchema, // TODO: change this
} as const;

// TODO: fix this, the return type is "any"
export function loadCache<T extends Dicts>(
  e: RequestEventBase,
  dict: T,
): z.infer<(typeof Packages)[T]> | null {
  const sharedMap = loadSharedMap(e);
  const cache = (sharedMap.cache as any)[dict]; // TODO: change this
  if (!cache) return null;
  const parsed = Packages[dict].safeParse(cache);
  return parsed.success ? parsed.data : null;
}
