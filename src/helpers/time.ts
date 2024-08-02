import type { RequestEventBase } from "@builder.io/qwik-city";
import { loadSharedMap } from "./request";
import type { Performance } from "~/types/shared";

export type StartTimeTypes = number | Date | RequestEventBase;

export function time(start: StartTimeTypes): number {
  if (typeof start === "number") {
    return Date.now() - start;
  }
  if (start instanceof Date) {
    return Date.now() - start.getTime();
  }
  return Date.now() - loadSharedMap(start).startTime;
}

export function perf(start: StartTimeTypes): Performance {
  return { took: time(start), cached: false };
}
