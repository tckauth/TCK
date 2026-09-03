import { AppShell } from '@/components/layout/app-shell';
import { requireRole } from '@/lib/auth/authorization';
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, roles, shellSettings } = await requireRole([
    'SUPER_ADMIN',
    'APPR_ADMIN',
    'AUDIT_ADMIN',
  ]);
  return (
    <AppShell email={user.email ?? '관리자'} roles={roles} {...shellSettings}>
      {children}
    </AppShell>
  );
}
