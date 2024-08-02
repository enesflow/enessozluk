import { z } from "zod";

export const weakString = () => z.string().nullable().optional();

export const PerformanceSchema = z.object({
  took: z.number(),
});

export type Performance = z.infer<typeof PerformanceSchema>;
