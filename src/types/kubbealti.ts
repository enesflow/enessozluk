import { z } from "zod";
import { PerformanceSchema, weakString } from "./shared";

export const KUBBEALTI_VERSION = "1.0.1" as const;

export const KubbealtiResponseSchema = z.object({
  version: z.literal(KUBBEALTI_VERSION),
  perf: PerformanceSchema,
  items: z.array(z.object({ number: z.number(), current: z.boolean() })),
  url: z.string(),
  totalPages: z.number(),
  totalElements: z.number(),
  lastPage: z.boolean(),
  hasPreviousPage: z.boolean(),
  hasNextPage: z.boolean(),
  firstPage: z.boolean(),
  size: z.number(),
  content: z.array(
    z.object({
      pageNumber: z.null(),
      pageCount: z.number(),
      id: z.number(),
      entityStatus: z.number().nullable(),
      entityVersion: z.number().nullable(),
      dateModified: z.number().nullable(),
      modifier: z.null(),
      creationTime: z.number().nullable(),
      kelime: z.string(),
      anlam: z.string(),
      status: z.number(),
      surumId: z.number(),
      baseWordId: z.number().nullable(),
      surum: z
        .object({
          pageNumber: z.null(),
          pageCount: z.number(),
          id: z.number(),
          entityStatus: z.number(),
          entityVersion: z.number(),
          dateModified: z.number(),
          modifier: z.null(),
          creationTime: z.number(),
          parameterType: z.object({
            pageNumber: z.null(),
            pageCount: z.number(),
            id: z.number(),
            entityStatus: z.number(),
            entityVersion: z.number(),
            dateModified: z.number(),
            modifier: z.null(),
            creationTime: z.number(),
            name: weakString(),
            code: weakString(),
            handler: z.object({}),
            hibernateLazyInitializer: z.object({}),
          }),
          value: weakString(),
          factorOne: z.string().nullable(),
          active: z.boolean().nullable(),
          orderId: z.number(),
          paramTypeId: z.number(),
          handler: z.object({}),
          hibernateLazyInitializer: z.object({}),
        })
        .nullable(),
      kelimeSiralama: z.string(),
      wordSearch: z.string(),
      noHtml: z.string(),
      anlamAksansiz: z.string().nullable(),
      ozet: z.null(),
      url: z.null(),
      pool: z.boolean().nullable(),
      indexedTime: z.null(),
      indexed: z.null(),
      audioUrl: z.null(),
    }),
  ),
  number: z.number(),
});

export const KubbealtiErrorSchema = z.object({
  version: z.literal(KUBBEALTI_VERSION),
  serverDefinedReason: z.string(),
  perf: PerformanceSchema,
  // items: z.array(z.unknown()).length(0),
  url: z.string(),
  totalPages: z.number().optional(),
  totalElements: z.number().optional(),
  lastPage: z.boolean().optional(),
  hasPreviousPage: z.boolean().optional(),
  hasNextPage: z.boolean().optional(),
  firstPage: z.boolean().optional(),
  size: z.number().optional(),
  content: z.array(z.unknown()).optional(),
  number: z.number().optional(),
});

export const KubbealtiPackageSchema =
  KubbealtiResponseSchema.or(KubbealtiErrorSchema);

export type KubbealtiResponse = z.infer<typeof KubbealtiResponseSchema>;
export type KubbealtiError = z.infer<typeof KubbealtiErrorSchema>;
export type KubbealtiPackage = z.infer<typeof KubbealtiPackageSchema>;
