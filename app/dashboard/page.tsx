import { Activity, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/metric-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireUser } from '@/lib/auth/authorization';
export default async function DashboardPage() {
  const { supabase } = await requireUser();
  const [users, active, logs] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ACTIVE'),
    supabase
      .from('audit_logs')
      .select('id, action, description, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
  ]);
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">OVERVIEW</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          운영 대시보드
        </h1>
        <p className="mt-2 text-muted-foreground">
          서비스와 사용자의 주요 상태를 확인하세요.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="전체 사용자"
          value={String(users.count ?? 0)}
          detail="등록된 계정"
          icon={Users}
        />
        <MetricCard
          label="활성 사용자"
          value={String(active.count ?? 0)}
          detail="현재 이용 가능"
          icon={UserCheck}
        />
        <MetricCard
          label="관리 역할"
          value="4"
          detail="RBAC 역할 그룹"
          icon={ShieldCheck}
        />
        <MetricCard
          label="최근 작업"
          value={String(logs.data?.length ?? 0)}
          detail="감사 로그 항목"
          icon={Activity}
        />
      </div>
      <Card className="mt-6 shadow-none">
        <CardHeader>
          <CardTitle>최근 관리자 활동</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.data?.length ? (
            <div className="divide-y">
              {logs.data.map((log) => (
                <div key={log.id} className="flex items-center gap-4 py-4">
                  <span className="size-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.description ?? '관리 작업이 기록되었습니다.'}
                    </p>
                  </div>
                  <time className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString('ko-KR')}
                  </time>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              아직 기록된 관리자 활동이 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
