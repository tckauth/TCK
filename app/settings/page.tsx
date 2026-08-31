import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requireUser } from '@/lib/auth/authorization';
export default async function MySettingsPage() {
  const { user } = await requireUser();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">내 설정</h1>
      <p className="mb-6 mt-2 text-muted-foreground">
        계정과 보안 정보를 확인합니다.
      </p>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>계정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-muted-foreground">이메일</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground">이메일 인증</p>
            <p className="font-medium">
              {user.email_confirmed_at ? '인증됨' : '미인증'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
