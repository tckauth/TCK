import { AppShell } from '@/components/layout/app-shell';
import { requireUser } from '@/lib/auth/authorization';
export default async function VisitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, roles, shellSettings } = await requireUser();
  return (
    <AppShell email={user.email ?? '사용자'} roles={roles} {...shellSettings}>
      {children}
    </AppShell>
  );
}
