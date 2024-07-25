import { z } from "zod";

// export const weakString = z.string().optional().nullable();
export const weakString = () => z.string().optional().nullable();
