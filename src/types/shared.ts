import { z } from "zod";

export const weakString = () => z.string().nullable().optional();
