import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireRole } from '@/lib/auth/authorization';
export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const { supabase } = await requireRole(['SUPER_ADMIN', 'ADMIN']);
  const { action } = await searchParams;
  let query = supabase
    .from('audit_logs')
    .select('*, profiles(email)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (action) query = query.eq('action', action);
  const { data } = await query;
  return (
    <div className="mx-auto max-w-7xl">
      <p className="text-sm font-medium text-primary">SECURITY</p>
      <h1 className="text-3xl font-bold tracking-tight">시스템 로그</h1>
      <p className="mb-6 mt-2 text-muted-foreground">
        중요한 관리자 작업을 추적합니다.
      </p>
      <Card className="shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>작업</TableHead>
                  <TableHead>수행자</TableHead>
                  <TableHead>대상</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead>시간</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell>
                      {(log.profiles as unknown as { email: string } | null)
                        ?.email ?? '시스템'}
                    </TableCell>
                    <TableCell>{log.target_type ?? '—'}</TableCell>
                    <TableCell>{log.description ?? '—'}</TableCell>
                    <TableCell>
                      {new Date(log.created_at).toLocaleString('ko-KR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!data?.length && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              표시할 로그가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
