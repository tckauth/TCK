'use server';

import { passwordSchema } from '@/lib/validation/auth';
import { requireUser } from '@/lib/auth/authorization';

export type PasswordChangeState = { ok: boolean; message: string };

export async function changePassword(
  _: PasswordChangeState,
  formData: FormData,
): Promise<PasswordChangeState> {
  const password = formData.get('password');
  const confirmation = formData.get('passwordConfirmation');
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? '비밀번호를 확인하세요.' };
  }
  if (password !== confirmation) {
    return { ok: false, message: '비밀번호 확인이 일치하지 않습니다.' };
  }
  const { supabase, user } = await requireUser();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { ok: false, message: '비밀번호를 변경하지 못했습니다. 다시 시도하세요.' };
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'CHANGE_PASSWORD',
    target_type: 'AUTH',
    target_id: user.id,
    description: '사용자가 비밀번호를 변경했습니다.',
  });
  return { ok: true, message: '비밀번호가 변경되었습니다.' };
}
