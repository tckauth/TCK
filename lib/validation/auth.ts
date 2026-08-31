import { z } from 'zod';
export const emailSchema = z.email('올바른 이메일을 입력하세요.').max(254);
export const passwordSchema = z
  .string()
  .min(8, '비밀번호는 8자 이상이어야 합니다.')
  .max(72);
export const authSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export const signupSchema = authSchema.extend({
  fullName: z.string().trim().min(2).max(80),
});
