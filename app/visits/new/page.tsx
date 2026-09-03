import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VisitForm } from '@/components/visits/visit-form';
import { createVisit } from '../actions';
import { getRoles, requireUser } from '@/lib/auth/authorization';
export default async function NewVisitPage() {
  const { supabase, user } = await requireUser();
  const roles = await getRoles(user.id);
  const { data: managers } = await supabase.rpc('list_tck_managers');
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-medium text-primary">VISITER ACCESS</p>
      <h1 className="text-3xl font-bold tracking-tight">방문/공사 등록</h1>
      <p className="mb-6 mt-2 text-muted-foreground">
        필수 정보를 입력하세요. TBM 상태는 TCK 담당 권한자가 별도로 확인합니다.
      </p>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>방문 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <VisitForm
            action={createVisit}
            managers={managers ?? []}
            canManageTbm={roles.some((role) => ['SUPER_ADMIN', 'TBM_ADMIN'].includes(role))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
