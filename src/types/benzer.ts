import { z } from "zod";

export const BenzerResponseSchema = z.object({
  url: z.string(),
  isUnsuccessful: z.literal(false),
  words: z.array(z.string()),
  moreWords: z.record(z.array(z.string())),
});

export const BenzerResponseErrorSchema = z.object({
  url: z.string(),
  isUnsuccessful: z.literal(true),
  serverDefinedErrorText: z.string().optional(),
  serverDefinedCaptchaError: z.boolean().optional(),
  serverDefinedReFetchWith: z.string().optional(),
  words: z.array(z.string()).optional(),
});

export const BenzerPackageSchema = BenzerResponseSchema.or(
  BenzerResponseErrorSchema,
);

export type BenzerResponse = z.infer<typeof BenzerResponseSchema>;
export type BenzerResponseError = z.infer<typeof BenzerResponseErrorSchema>;
export type BenzerPackage = z.infer<typeof BenzerPackageSchema>;
