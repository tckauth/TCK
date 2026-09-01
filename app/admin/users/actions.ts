'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireRole } from '@/lib/auth/authorization';
import { createAdminClient } from '@/lib/supabase/admin';
import type { AppRole } from '@/types/database';

const userSchema = z.object({
  email: z.email().max(254),
  fullName: z.string().trim().min(2).max(80),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'TBM_MANAGER', 'VIEWER', 'EXTERNAL']),
});
export type ActionResult = { ok: boolean; message: string };
const managedRoleSchema = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'TBM_MANAGER',
  'VIEWER',
  'EXTERNAL',
]);
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
  const actorRoles = await (async () => {
    const admin = createAdminClient();
    const { data } = await admin
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id);
    return (data ?? []).map(
      (row) => (row.roles as unknown as { name: AppRole }).name,
    );
  })();
  if (
    !actorRoles.includes('SUPER_ADMIN') &&
    ['SUPER_ADMIN', 'ADMIN'].includes(parsed.data.role)
  )
    return { ok: false, message: '해당 관리자 역할을 부여할 권한이 없습니다.' };
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
  await admin
    .from('profiles')
    .update({ status: 'ACTIVE', approved_at: new Date().toISOString(), approved_by: user.id })
    .eq('id', data.user.id);
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
export async function setUserRole(userId: string, formData: FormData) {
  const { user, roles: actorRoles } = await requireRole([
    'SUPER_ADMIN',
    'ADMIN',
  ]);
  const parsed = managedRoleSchema.safeParse(formData.get('role'));
  if (!parsed.success) return;
  const isSuper = actorRoles.includes('SUPER_ADMIN');
  if (user.id === userId && !isSuper) return;
  if (!isSuper && ['SUPER_ADMIN', 'ADMIN'].includes(parsed.data)) return;

  const admin = createAdminClient();
  const { data: current } = await admin
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', userId);
  const currentRoles = (current ?? []).map(
    (row) => (row.roles as unknown as { name: AppRole }).name,
  );
  if (!isSuper && currentRoles.some((r) => ['SUPER_ADMIN', 'ADMIN'].includes(r)))
    return;

  const { data: targetRole } = await admin
    .from('roles')
    .select('id')
    .eq('name', parsed.data)
    .single();
  if (!targetRole) return;
  await admin.from('user_roles').upsert(
    { user_id: userId, role_id: targetRole.id },
    { onConflict: 'user_id,role_id' },
  );
  await admin
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .neq('role_id', targetRole.id);
  await audit(
    user.id,
    'CHANGE_USER_ROLE',
    userId,
    `사용자 역할을 ${parsed.data}(으)로 변경했습니다.`,
  );
  revalidatePath('/admin/users');
}
export async function setUserStatus(
  userId: string,
  status: 'ACTIVE' | 'INACTIVE',
) {
  const { user } = await requireRole(['SUPER_ADMIN', 'ADMIN']);
  if (user.id === userId && status === 'INACTIVE') return;
  const admin = createAdminClient();
  const { data: target } = await admin
    .from('profiles')
    .select('status')
    .eq('id', userId)
    .single();
  if (target?.status === 'PENDING') return;
  await admin.from('profiles').update({ status }).eq('id', userId);
  await audit(
    user.id,
    'UPDATE_USER',
    userId,
    `사용자 상태를 ${status}(으)로 변경했습니다.`,
  );
  revalidatePath('/admin/users');
}
export async function approveUser(userId: string) {
  const { user } = await requireRole(['TBM_MANAGER']);
  if (user.id === userId) return;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('status,email')
    .eq('id', userId)
    .single();
  if (!profile || profile.status !== 'PENDING') return;
  await admin
    .from('profiles')
    .update({
      status: 'ACTIVE',
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq('id', userId)
    .eq('status', 'PENDING');
  await audit(
    user.id,
    'APPROVE_SIGNUP',
    userId,
    `${profile.email} 가입을 승인했습니다.`,
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
