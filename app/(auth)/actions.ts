'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { authSchema, signupSchema } from '@/lib/validation/auth';

export type AuthState = { error?: string; success?: string };
export async function login(
  _: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = authSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? '입력값을 확인하세요.' };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: '이메일 또는 비밀번호를 확인하세요.' };
  redirect('/dashboard');
}
export async function signup(
  _: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? '입력값을 확인하세요.' };
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });
  return error
    ? { error: '회원가입을 완료하지 못했습니다.' }
    : { success: '인증 메일을 보냈습니다. 이메일을 확인하세요.' };
}
export async function requestReset(
  _: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const value = formData.get('email');
  const email = typeof value === 'string' ? value : '';
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/reset-password`,
  });
  return { success: '계정이 존재하면 재설정 메일이 발송됩니다.' };
}
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
