import { z } from "zod";

export const BenzerResponseSchema = z.object({
  isUnsuccessful: z.literal(false),
  words: z.array(z.string()),
  moreWords: z.record(z.array(z.string())),
});

export const BenzerResponseErrorSchema = z.object({
  isUnsuccessful: z.literal(true),
  serverDefinedErrorText: z.string().optional(),
  serverDefinedCaptchaError: z.boolean().optional(),
  words: z.array(z.string()).optional(),
});

export const BenzerPackageSchema = z.union([
  BenzerResponseSchema,
  BenzerResponseErrorSchema,
]);

export type BenzerResponse = z.infer<typeof BenzerResponseSchema>;
export type BenzerResponseError = z.infer<typeof BenzerResponseErrorSchema>;
export type BenzerPackage = z.infer<typeof BenzerPackageSchema>;
