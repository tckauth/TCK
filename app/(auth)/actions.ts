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
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: '이메일 또는 비밀번호를 확인하세요.' };
  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', data.user.id)
    .single();
  if (profile?.status !== 'ACTIVE') {
    await supabase.auth.signOut();
    return {
      error:
        profile?.status === 'PENDING'
          ? 'TBM 담당자의 가입 승인을 기다리고 있습니다.'
          : '비활성화된 계정입니다. 관리자에게 문의하세요.',
    };
  }
  await supabase.from('profiles').update({ last_sign_in_at: new Date().toISOString() }).eq('id', data.user.id);
  await supabase.from('audit_logs').insert({
    user_id: data.user.id,
    action: 'LOGIN',
    target_type: 'AUTH',
    target_id: data.user.id,
    description: '로그인에 성공했습니다.',
  });
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
      data: {
        full_name: parsed.data.fullName,
        registration_source: 'SELF_SERVICE',
      },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });
  return error
    ? { error: '회원가입을 완료하지 못했습니다.' }
    : {
        success:
          '가입 신청이 접수되었습니다. 이메일 인증 후 TBM 담당자의 승인을 기다려 주세요.',
      };
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
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'LOGOUT',
      target_type: 'AUTH',
      target_id: user.id,
      description: '로그아웃했습니다.',
    });
  }
  await supabase.auth.signOut();
  redirect('/login');
}
