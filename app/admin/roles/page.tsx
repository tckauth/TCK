import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireRole } from '@/lib/auth/authorization';
export default async function RolesPage() {
  const { supabase } = await requireRole(['SUPER_ADMIN']);
  const { data } = await supabase
    .from('roles')
    .select('*, role_permissions(permissions(name, description))')
    .order('level', { ascending: false });
  return (
    <div className="mx-auto max-w-7xl">
      <p className="text-sm font-medium text-primary">RBAC</p>
      <h1 className="text-3xl font-bold tracking-tight">역할 및 권한</h1>
      <p className="mb-6 mt-2 text-muted-foreground">
        서버와 RLS에서 동일한 역할 체계를 적용합니다.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((role) => (
          <Card key={role.id} className="shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {role.name}
                <span className="text-xs font-normal text-muted-foreground">
                  Level {role.level}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                {role.description}
              </p>
              <div className="space-y-2">
                {(
                  role.role_permissions as unknown as Array<{
                    permissions: { name: string; description: string } | null;
                  }>
                ).map(
                  (item) =>
                    item.permissions && (
                      <div
                        key={item.permissions.name}
                        className="flex gap-2 text-sm"
                      >
                        <Check className="mt-0.5 size-4 text-emerald-600" />
                        <span>
                          <strong className="font-medium">
                            {item.permissions.name}
                          </strong>
                          <span className="block text-xs text-muted-foreground">
                            {item.permissions.description}
                          </span>
                        </span>
                      </div>
                    ),
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
