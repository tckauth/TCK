import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { requireRole } from '@/lib/auth/authorization';
import { updateSettings } from './actions';
export default async function SettingsPage() {
  const { supabase } = await requireRole(['SUPER_ADMIN', 'ADMIN']);
  const { data } = await supabase.from('system_settings').select('key,value');
  const settings = Object.fromEntries(
    (data ?? []).map((row) => [row.key, row.value]),
  );
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-medium text-primary">CONFIGURATION</p>
      <h1 className="text-3xl font-bold tracking-tight">서비스 설정</h1>
      <p className="mb-6 mt-2 text-muted-foreground">
        공개 서비스 이름과 운영 상태를 관리합니다.
      </p>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>기본 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateSettings} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="site_title">서비스 이름</Label>
              <Input
                id="site_title"
                name="site_title"
                defaultValue={String(
                  settings.site_title ?? 'Aegis Console',
                ).replaceAll('"', '')}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <Label htmlFor="maintenance_mode">유지보수 모드</Label>
                <p className="text-xs text-muted-foreground">
                  관리자 외 사용자의 접근을 제한할 때 사용합니다.
                </p>
              </div>
              <Switch
                id="maintenance_mode"
                name="maintenance_mode"
                defaultChecked={settings.maintenance_mode === true}
              />
            </div>
            <Button>설정 저장</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
