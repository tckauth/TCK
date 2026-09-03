import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AppRole } from '@/types/database';
import { cache } from 'react';
import { getRuntimeSettings } from '@/lib/settings';
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
  const [settings, roles] = await Promise.all([
    getRuntimeSettings(),
    getRoles(user.id),
  ]);
  if (settings.maintenanceMode && !roles.includes('SUPER_ADMIN')) redirect('/maintenance');
  return { supabase, user };
}
export const getRoles = cache(async (userId: string): Promise<AppRole[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', userId);
  return (data ?? []).flatMap((item) => {
    const role = item.roles as unknown as { name: AppRole } | null;
    return role?.name ? [role.name] : [];
  });
});
export async function requireRole(allowed: AppRole[]) {
  const context = await requireUser();
  const roles = await getRoles(context.user.id);
  if (!roles.some((role) => allowed.includes(role)))
    redirect('/dashboard?error=forbidden');
  return { ...context, roles };
}
