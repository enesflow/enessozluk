import { z } from "zod";
import { PerformanceSchema } from "./shared";

export const RHYME_VERSION = "1.0.9" as const;

export const RhymeResponseSchema = z.object({
  word: z.string(),
  version: z.literal(RHYME_VERSION),
  perf: PerformanceSchema,
  items: z.array(z.string()),
  more: z.array(z.string()).optional(),
});
export const RhymeErrorSchema = z.object({
  word: z.string(),
  version: z.literal(RHYME_VERSION),
  perf: PerformanceSchema,
  serverDefinedError: z.string(),
});

export const RhymePackageSchema = RhymeResponseSchema.or(RhymeErrorSchema);

export type RhymeResponse = z.infer<typeof RhymeResponseSchema>;
export type RhymeErrorResponse = z.infer<typeof RhymeErrorSchema>;
export type RhymePackage = z.infer<typeof RhymePackageSchema>;
