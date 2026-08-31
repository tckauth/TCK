'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth/authorization';
import { createAdminClient } from '@/lib/supabase/admin';

const userSchema = z.object({
  email: z.email().max(254),
  fullName: z.string().trim().min(2).max(80),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER']),
});
export type ActionResult = { ok: boolean; message: string };
async function audit(
  actor: string,
  action: string,
  target: string,
  description: string,
) {
  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    user_id: actor,
    action,
    target_type: 'USER',
    target_id: target,
    description,
  });
}
export async function createUser(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user } = await requireRole(['SUPER_ADMIN', 'ADMIN']);
  const parsed = userSchema.safeParse({
    email: formData.get('email'),
    fullName: formData.get('fullName'),
    role: formData.get('role'),
  });
  if (!parsed.success) return { ok: false, message: '입력값을 확인하세요.' };
  const admin = createAdminClient();
  const password = crypto.randomUUID() + 'aA1!';
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password,
    email_confirm: false,
    user_metadata: { full_name: parsed.data.fullName },
  });
  if (error || !data.user)
    return { ok: false, message: '사용자를 생성하지 못했습니다.' };
  const { data: role } = await admin
    .from('roles')
    .select('id')
    .eq('name', parsed.data.role)
    .single();
  if (role)
    await admin
      .from('user_roles')
      .upsert({ user_id: data.user.id, role_id: role.id });
  await admin.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/reset-password`,
  });
  await audit(
    user.id,
    'CREATE_USER',
    data.user.id,
    `${parsed.data.email} 계정을 생성했습니다.`,
  );
  revalidatePath('/admin/users');
  return {
    ok: true,
    message: '사용자를 만들고 비밀번호 설정 메일을 보냈습니다.',
  };
}
export async function setUserStatus(
  userId: string,
  status: 'ACTIVE' | 'INACTIVE',
) {
  const { user } = await requireRole(['SUPER_ADMIN', 'ADMIN']);
  if (user.id === userId && status === 'INACTIVE') return;
  const admin = createAdminClient();
  await admin.from('profiles').update({ status }).eq('id', userId);
  await audit(
    user.id,
    'UPDATE_USER',
    userId,
    `사용자 상태를 ${status}(으)로 변경했습니다.`,
  );
  revalidatePath('/admin/users');
}
export async function deleteUser(userId: string) {
  const { user } = await requireRole(['SUPER_ADMIN']);
  if (user.id === userId) return;
  const admin = createAdminClient();
  await audit(user.id, 'DELETE_USER', userId, '사용자 계정을 삭제했습니다.');
  await admin.auth.admin.deleteUser(userId);
  revalidatePath('/admin/users');
}
