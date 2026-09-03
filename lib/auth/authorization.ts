import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AppRole } from '@/types/database';
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect('/login');
  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single();
  if (profile?.status !== 'ACTIVE') {
    await supabase.auth.signOut();
    redirect('/login?error=approval-required');
  }
  const [{ data: maintenanceSetting }, { data: roleRows }] = await Promise.all([
    supabase.from('system_settings').select('value').eq('key', 'maintenance_mode').maybeSingle(),
    supabase.from('user_roles').select('roles(name)').eq('user_id', user.id),
  ]);
  const isSuper = (roleRows ?? []).some((row) => {
    const role = row.roles as unknown as { name?: string } | null;
    return role?.name === 'SUPER_ADMIN';
  });
  if (maintenanceSetting?.value === true && !isSuper) redirect('/maintenance');
  return { supabase, user };
}
export async function getRoles(userId: string): Promise<AppRole[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', userId);
  return (data ?? []).flatMap((item) => {
    const role = item.roles as unknown as { name: AppRole } | null;
    return role?.name ? [role.name] : [];
  });
}
export async function requireRole(allowed: AppRole[]) {
  const context = await requireUser();
  const roles = await getRoles(context.user.id);
  if (!roles.some((role) => allowed.includes(role)))
    redirect('/dashboard?error=forbidden');
  return { ...context, roles };
}
