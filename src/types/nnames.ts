import { z } from "zod";
import { PerformanceSchema, weakString } from "~/types/shared";

export const NNAMES_VERSION = "1.0.0" as const;

export const NNameSchema = z.object({
  serverDefinedIsMisspellings: z.boolean().optional(),
  name: z.string(),
  count: z.number(),
  countOld: z.object({ male: z.number(), female: z.number() }),
  sources: z.array(z.string()),
  languages: z.array(z.string()),
  communities: z.object({
    male: z.object({
      isPredominant: z.boolean(),
      isRare: z.boolean(),
      items: z.array(z.string()),
    }),
    female: z.object({
      isPredominant: z.boolean(),
      isRare: z.boolean(),
      items: z.array(z.string()),
    }),
  }),
  romanizedText: z.string(),
  originalText: z.string(),
  isCertain: z.boolean(),
  origin: z.object({
    languages: z.array(z.string()),
    romanizedText: z.string(),
    originalText: z.string(),
    definition: z.string(),
    reference: z
      .object({
        to: z.array(z.string()),
        isAbbreviation: z.boolean(),
        isCompound: z.boolean(),
        isCertain: z.boolean(),
      })
      .optional(),
  }),
  definition: z.string(),
  note: z.string(),
  region: z.object({
    locations: z.array(z.object({ name: z.string() })),
    isConcentrated: z.boolean(),
    isNationwide: z.boolean(),
    isWestern: z.boolean(),
    isEastern: z.boolean(),
    isTurkophone: z.boolean(),
  }),
  reference: z.object({
    to: z.array(z.string()),
    isAbbreviation: z.boolean(),
    isCompound: z.boolean(),
    isCertain: z.boolean(),
  }),
  variants: z.array(
    z
      .object({
        name: z.string(),
        count: z.object({
          total: z.number(),
          /* single: z.number(),
          left: z.number(),
          right: z.number(), */
        }),
        /* countOld: z.object({ male: z.number(), female: z.number() }), */
        /* timeUpdated: z.string(), */
        // years: ...
        // provinces: z.object({ raw: ..., proportional: ... }),
      })
      .strip(),
  ),
  rank: z.number(),
  relatedNames: z.array(z.string()),
});

export const NNamesResponseSchema = z.object({
  url: z.string(),
  version: z.literal(NNAMES_VERSION).default(NNAMES_VERSION),
  perf: PerformanceSchema,
  isSuccessful: z.boolean(),
  names: z.array(NNameSchema),
  referredNames: z.array(
    z.object({
      name: z.string(),
      ///... this can be also NNameSchema
    }),
  ),
  // randomName: z.string(),
});

export const NNamesErrorSchema = z.object({
  serverDefinedError: weakString(),
  url: z.string(),
  version: z.literal(NNAMES_VERSION).default(NNAMES_VERSION),
  perf: PerformanceSchema,
  isSuccessful: z.literal(false),
  // names: ...
  // referredNames: ...
});

export const NNamesPackageSchema = NNamesResponseSchema.or(NNamesErrorSchema);

export type NName = z.infer<typeof NNameSchema>;
export type NNamesResponse = z.infer<typeof NNamesResponseSchema>;
export type NNamesError = z.infer<typeof NNamesErrorSchema>;
export type NNamesPackage = z.infer<typeof NNamesPackageSchema>;
