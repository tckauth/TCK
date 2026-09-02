import { z } from 'zod';
export const emailSchema = z.email('올바른 이메일을 입력하세요.').max(254);
export const passwordSchema = z
  .string()
  .min(8, '비밀번호는 8자 이상이어야 합니다.')
  .max(72)
  .regex(/[A-Z]/, '대문자 영문을 1개 이상 포함하세요.')
  .regex(/[a-z]/, '소문자 영문을 1개 이상 포함하세요.')
  .regex(/[0-9]/, '숫자를 1개 이상 포함하세요.')
  .regex(/[^A-Za-z0-9]/, '특수문자를 1개 이상 포함하세요.');
export const authSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '비밀번호를 입력하세요.').max(72),
});
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().trim().min(2).max(80),
});
