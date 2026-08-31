import { AppShell } from '@/components/layout/app-shell';
import { requireRole } from '@/lib/auth/authorization';
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, roles } = await requireRole([
    'SUPER_ADMIN',
    'ADMIN',
    'TBM_MANAGER',
  ]);
  return (
    <AppShell email={user.email ?? '관리자'} roles={roles}>
      {children}
    </AppShell>
  );
}
