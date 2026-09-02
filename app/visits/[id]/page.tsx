import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VisitForm } from '@/components/visits/visit-form';
import { DeleteVisitButton } from '@/components/visits/delete-visit-button';
import { getRoles, requireUser } from '@/lib/auth/authorization';
import { updateVisit } from '../actions';
export default async function VisitDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const roles = await getRoles(user.id);
  const staff = roles.some((r) =>
    ['SUPER_ADMIN', 'TBM_ADMIN'].includes(r),
  );
  const [{ data: visit }, { data: managers }] = await Promise.all([
    supabase
      .from('visits')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single(),
    supabase
      .from('profiles')
      .select('id,full_name,email')
      .eq('status', 'ACTIVE')
      .order('full_name')
      .limit(200),
  ]);
  if (!visit) notFound();
  const canEdit = staff || visit.created_by === user.id;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-primary">VISIT DETAIL</p>
          <h1 className="text-3xl font-bold tracking-tight">
            {visit.company_name}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {visit.visit_date} · TBM{' '}
            <Badge
              variant={
                visit.tbm_yn === 'O'
                  ? 'default'
                  : visit.tbm_yn === 'X'
                    ? 'destructive'
                    : 'outline'
              }
            >
              {visit.tbm_yn ?? '미입력'}
            </Badge>
          </p>
        </div>
        {staff && <DeleteVisitButton id={id} />}
      </div>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>
            {canEdit ? '방문/공사 정보 수정' : '방문/공사 정보'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {canEdit ? (
            <VisitForm
              action={updateVisit.bind(null, id)}
              managers={managers ?? []}
              initial={visit}
            />
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">목적</dt>
                <dd>{visit.purpose}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">인원</dt>
                <dd>{visit.visitor_count}명</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">장소</dt>
                <dd>{visit.construction_location}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">공사유무</dt>
                <dd>{visit.construction_yn ? 'O' : 'X'}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
