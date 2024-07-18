import { z } from "zod";

export const LuggatWordSchema = z.object({
  name: z.string(),
  definitions: z.array(z.string()),
});

export const LuggatResponseSchema = z.object({
  url: z.string(),
  isUnsuccessful: z.literal(false),
  words: LuggatWordSchema.array(),
});

export const LuggatResponseErrorSchema = z.object({
  url: z.string(),
  isUnsuccessful: z.literal(true),
  serverDefinedErrorText: z.string().optional(),
});

export const LuggatPackageSchema = LuggatResponseSchema.or(
  LuggatResponseErrorSchema,
);

export type LuggatWord = z.infer<typeof LuggatWordSchema>;
export type LuggatResponse = z.infer<typeof LuggatResponseSchema>;
export type LuggatResponseError = z.infer<typeof LuggatResponseErrorSchema>;
export type LuggatPackage = z.infer<typeof LuggatPackageSchema>;
