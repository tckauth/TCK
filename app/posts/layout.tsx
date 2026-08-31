import { AppShell } from '@/components/layout/app-shell';
import { getRoles, requireUser } from '@/lib/auth/authorization';
export default async function PostsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireUser();
  const roles = await getRoles(user.id);
  return (
    <AppShell email={user.email ?? '사용자'} roles={roles}>
      {children}
    </AppShell>
  );
}
