import Link from 'next/link';
import {
  Activity,
  Bell,
  BookOpen,
  CalendarPlus,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Monitor,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { logout } from '@/app/(auth)/actions';
import type { AppRole } from '@/types/database';

const links: ReadonlyArray<
  readonly [string, string, typeof LayoutDashboard, AppRole[]]
> = [
  ['/dashboard', '대시보드', LayoutDashboard, ['SUPER_ADMIN', 'AUDIT_ADMIN', 'APPR_ADMIN', 'TBM_ADMIN', 'VIEWER', 'VISITER']],
  ['/visits', '방문/공사 현황', ClipboardCheck, ['SUPER_ADMIN', 'TBM_ADMIN', 'VIEWER', 'VISITER']],
  ['/visits/new', '방문/공사 등록', CalendarPlus, ['SUPER_ADMIN', 'TBM_ADMIN', 'VISITER']],
  ['/board', '현황판', Monitor, ['SUPER_ADMIN', 'TBM_ADMIN', 'VIEWER']],
  ['/posts', '게시판', BookOpen, ['SUPER_ADMIN', 'VIEWER']],
  ['/admin/users', '사용자 관리', Users, ['SUPER_ADMIN', 'APPR_ADMIN']],
  ['/admin/roles', '권한 관리', ShieldCheck, ['SUPER_ADMIN']],
  ['/admin/settings', '서비스 설정', SlidersHorizontal, ['SUPER_ADMIN']],
  ['/admin/logs', '시스템 로그', Activity, ['SUPER_ADMIN', 'AUDIT_ADMIN']],
  ['/settings', '내 설정', Settings, ['SUPER_ADMIN', 'AUDIT_ADMIN', 'APPR_ADMIN', 'TBM_ADMIN', 'VIEWER', 'VISITER']],
] as const;
export function AppShell({
  children,
  email,
  roles,
}: {
  children: React.ReactNode;
  email: string;
  roles: AppRole[];
}) {
  const initial = email.slice(0, 1).toUpperCase();
  return (
    <div className="min-h-screen bg-muted/25 md:grid md:grid-cols-[250px_1fr]">
      <aside className="hidden border-r bg-[oklch(0.19_0.045_256)] text-white md:flex md:flex-col">
        <Link
          href="/dashboard"
          className="flex h-16 items-center gap-3 border-b border-white/10 px-6 font-semibold"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-white text-primary">
            <ShieldCheck className="size-5" />
          </span>
          TCK Safety Hub
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          {links
            .filter(([, , , allowed]) =>
              roles.some((role) => allowed.includes(role)),
            )
            .map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/65 transition hover:bg-white/10 hover:text-white"
            >
              <Icon className="size-4" />
              {label}
              <ChevronRight className="ml-auto size-3 opacity-40" />
            </Link>
            ))}
        </nav>
        <div className="border-t border-white/10 p-4 text-xs text-white/50">
          Cloudflare · Supabase
          <br />
          보안 연결됨
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/90 px-5 backdrop-blur lg:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold md:hidden"
          >
            <ShieldCheck className="size-5 text-primary" />
            TCK Safety
          </Link>
          <div className="hidden text-sm text-muted-foreground md:block">
            운영 워크스페이스
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="알림">
              <Bell />
            </Button>
            <Avatar className="size-8">
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="max-w-40 truncate text-xs font-medium">{email}</p>
              <p className="text-[11px] text-muted-foreground">
                {roles[0] ?? 'VIEWER'}
              </p>
            </div>
            <form action={logout}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                aria-label="로그아웃"
              >
                <LogOut />
              </Button>
            </form>
          </div>
        </header>
        <main className="p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
