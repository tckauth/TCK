import { z } from 'zod';
export const visitSchema = z.object({
  visitStartDate: z.iso.date(),
  visitEndDate: z.iso.date(),
  companyName: z.string().trim().min(1).max(120),
  purpose: z.string().trim().min(1).max(1000),
  visitorCount: z.coerce.number().int().positive().max(10000),
  constructionLocation: z.string().trim().min(1).max(200),
  tckManagerId: z.uuid(),
  constructionYn: z.enum(['true', 'false']).transform((v) => v === 'true'),
  tbmYn: z.enum(['O', 'X']).optional(),
}).refine((value) => value.visitStartDate <= value.visitEndDate, {
  message: '종료일은 시작일보다 빠를 수 없습니다.',
  path: ['visitEndDate'],
});
export type VisitInput = z.infer<typeof visitSchema>;
