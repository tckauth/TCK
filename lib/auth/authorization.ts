import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AppRole } from '@/types/database';
import { cache } from 'react';
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect('/login');
  const { data: rawContext } = await supabase.rpc('current_user_context');
  const appContext = (rawContext ?? {}) as {
    status?: string;
    roles?: AppRole[];
    maintenance_mode?: boolean;
    site_title?: string;
    session_timeout_minutes?: number;
  };
  if (appContext.status !== 'ACTIVE') {
    await supabase.auth.signOut();
    redirect('/login?error=approval-required');
  }
  const roles = appContext.roles ?? [];
  if (appContext.maintenance_mode && !roles.includes('SUPER_ADMIN')) redirect('/maintenance');
  return {
    supabase,
    user,
    roles,
    shellSettings: {
      siteTitle: appContext.site_title || 'TCK Safety Hub',
      sessionTimeoutMinutes: appContext.session_timeout_minutes || 10,
    },
  };
});
export async function requireRole(allowed: AppRole[]) {
  const context = await requireUser();
  if (!context.roles.some((role) => allowed.includes(role)))
    redirect('/dashboard?error=forbidden');
  return context;
}
