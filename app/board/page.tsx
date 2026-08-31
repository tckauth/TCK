import { Users, HardHat, ClipboardCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { requireUser } from '@/lib/auth/authorization';
import { RealtimeRefresh } from '@/components/visits/realtime-refresh';
export default async function BoardPage() {
  const { supabase } = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('visits')
    .select(
      'id,visit_date,company_name,visitor_count,construction_location,construction_yn,tbm_yn,profiles!visits_tck_manager_id_fkey(full_name,email)',
    )
    .eq('visit_date', today)
    .is('deleted_at', null)
    .order('created_at');
  const total = (data ?? []).reduce((sum, v) => sum + v.visitor_count, 0);
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-primary">LIVE BOARD</p>
          <h1 className="text-3xl font-bold tracking-tight">오늘 방문 예정</h1>
          <p className="mt-2 text-muted-foreground">
            {today} 사업장 방문 및 TBM 현황
          </p>
        </div>
        <RealtimeRefresh />
      </div>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            <Users className="text-primary" />
            <div>
              <p className="text-2xl font-bold">{data?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">방문 업체</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            <HardHat className="text-primary" />
            <div>
              <p className="text-2xl font-bold">
                {data?.filter((v) => v.construction_yn).length ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">공사 건</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            <ClipboardCheck className="text-primary" />
            <div>
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">총 방문인원</p>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-3">
        {data?.map((v) => {
          const manager = v.profiles as unknown as {
            full_name: string | null;
            email: string;
          } | null;
          return (
            <Card
              key={v.id}
              className={
                v.tbm_yn === 'O'
                  ? 'border-emerald-200 bg-emerald-50'
                  : v.tbm_yn === 'X'
                    ? 'border-red-200 bg-red-50'
                    : ''
              }
            >
              <CardContent className="grid items-center gap-3 p-5 sm:grid-cols-[1fr_1fr_auto_auto]">
                <div>
                  <p className="text-lg font-semibold">{v.company_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {v.construction_location}
                  </p>
                </div>
                <div>
                  <p className="text-sm">
                    담당자 {manager?.full_name ?? manager?.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {v.visitor_count}명 · 공사 {v.construction_yn ? 'O' : 'X'}
                  </p>
                </div>
                <Badge
                  variant={
                    v.tbm_yn === 'O'
                      ? 'default'
                      : v.tbm_yn === 'X'
                        ? 'destructive'
                        : 'outline'
                  }
                  className="px-3 py-1"
                >
                  TBM {v.tbm_yn ?? '미입력'}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
        {!data?.length && (
          <Card className="shadow-none">
            <CardContent className="py-20 text-center text-muted-foreground">
              오늘 예정된 방문이 없습니다.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
