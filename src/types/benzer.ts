import { z } from "zod";

export const BenzerWordSchema = z.object({
  url: z.string(),
  name: z.string(),
  meaning: z.string(),
  words: z.array(z.string()),
  moreWords: z.record(z.array(z.string())),
});

export const BenzerResponseSchema = z.object({
  isUnsuccessful: z.literal(false),
  words: z.array(BenzerWordSchema),
});

export const BenzerResponseErrorSchema = z.object({
  url: z.string(),
  meaning: z.string().optional(),
  isUnsuccessful: z.literal(true),
  serverDefinedErrorText: z.string().optional(),
  serverDefinedCaptchaError: z.boolean().optional(),
  serverDefinedReFetchWith: z.string().optional(),
  words: z.array(z.string()).optional(),
});

export const BenzerPackageSchema = BenzerResponseSchema.or(
  BenzerResponseErrorSchema,
);

export type BenzerWord = z.infer<typeof BenzerWordSchema>;
export type BenzerResponse = z.infer<typeof BenzerResponseSchema>;
export type BenzerResponseError = z.infer<typeof BenzerResponseErrorSchema>;
export type BenzerPackage = z.infer<typeof BenzerPackageSchema>;
