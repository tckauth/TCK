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
