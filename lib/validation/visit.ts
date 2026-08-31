import { z } from 'zod';
export const visitSchema = z.object({
  visitDate: z.iso.date(),
  companyName: z.string().trim().min(1).max(120),
  purpose: z.string().trim().min(1).max(1000),
  visitorCount: z.coerce.number().int().positive().max(10000),
  constructionLocation: z.string().trim().min(1).max(200),
  tckManagerId: z.uuid(),
  constructionYn: z.enum(['true', 'false']).transform((v) => v === 'true'),
});
export type VisitInput = z.infer<typeof visitSchema>;
