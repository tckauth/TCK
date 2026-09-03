import { Search, UserPlus } from 'lucide-react';
import { requireRole } from '@/lib/auth/authorization';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreateUserForm } from '@/components/admin/create-user-form';
import {
  approveUser,
  setUserStatus,
  deleteUser,
  setUserRole,
} from './actions';
import { formatSeoulDate, formatSeoulDateTime } from '@/lib/date-time';
export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { supabase, roles } = await requireRole([
    'SUPER_ADMIN',
    'APPR_ADMIN',
  ]);
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const size = 10;
  let query = supabase
    .from('profiles')
    .select('*, user_roles(roles(name))', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * size, page * size - 1);
  if (params.q)
    query = query.or(
      `full_name.ilike.%${params.q.replaceAll(/[%,()]/g, '')}%,email.ilike.%${params.q.replaceAll(/[%,()]/g, '')}%`,
    );
  const { data, count } = await query;
  const canEdit = roles.some(
    (r) => r === 'APPR_ADMIN' || r === 'SUPER_ADMIN',
  );
  const canApprove = canEdit;
  const isSuper = roles.includes('SUPER_ADMIN');
  const pages = Math.max(1, Math.ceil((count ?? 0) / size));
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">ACCESS APPROVAL</p>
          <h1 className="text-3xl font-bold tracking-tight">사용자 관리</h1>
          <p className="mt-2 text-muted-foreground">
            {count ?? 0}개의 사용자 계정
          </p>
        </div>
        {canEdit && (
          <Dialog>
            <DialogTrigger render={<Button />}>
              <UserPlus />
              사용자 생성
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 사용자 생성</DialogTitle>
              </DialogHeader>
              <CreateUserForm />
            </DialogContent>
          </Dialog>
        )}
      </div>
      <Card className="shadow-none">
        <CardContent className="p-0">
          <form className="border-b p-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={params.q}
                placeholder="이름 또는 이메일 검색"
                className="pl-9"
              />
            </div>
          </form>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자명</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead>마지막 로그인</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((profile) => {
                  const related = profile.user_roles as unknown as Array<{
                    roles: { name: string } | null;
                  }>;
                  const role = related?.[0]?.roles?.name ?? 'VIEWER';
                  return (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <p className="font-medium">{profile.full_name ?? '이름 없음'}</p>
                      </TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell>
                        {canEdit &&
                        (isSuper || ['VIEWER', 'VISITER'].includes(role)) ? (
                          <form
                            action={setUserRole.bind(null, profile.id)}
                            className="flex min-w-44 gap-2"
                          >
                            <NativeSelect
                              name="role"
                              defaultValue={role}
                              aria-label={`${profile.email} 역할`}
                            >
                              {[
                                'VISITER',
                                'VIEWER',
                                ...(isSuper
                                  ? [
                                      'TBM_ADMIN',
                                      'APPR_ADMIN',
                                      'AUDIT_ADMIN',
                                      'SUPER_ADMIN',
                                    ]
                                  : []),
                              ].map((item) => (
                                <NativeSelectOption key={item} value={item}>
                                  {item}
                                </NativeSelectOption>
                              ))}
                            </NativeSelect>
                            <Button type="submit" variant="outline" size="sm">
                              저장
                            </Button>
                          </form>
                        ) : (
                          <Badge variant="outline">{role}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            profile.status === 'ACTIVE'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {profile.status === 'PENDING'
                            ? '승인 대기'
                            : profile.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatSeoulDate(profile.created_at)}
                      </TableCell>
                      <TableCell>
                        {profile.last_sign_in_at
                          ? formatSeoulDateTime(profile.last_sign_in_at)
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {canApprove && profile.status === 'PENDING' && (
                          <form
                            className="inline"
                            action={approveUser.bind(null, profile.id)}
                          >
                            <Button type="submit" size="sm">
                              가입 승인
                            </Button>
                          </form>
                        )}
                        {canEdit && profile.status !== 'PENDING' && (
                          <form
                            className="inline"
                            action={setUserStatus.bind(
                              null,
                              profile.id,
                              profile.status === 'ACTIVE'
                                ? 'INACTIVE'
                                : 'ACTIVE',
                            )}
                          >
                            <Button type="submit" variant="ghost" size="sm">
                              {profile.status === 'ACTIVE'
                                ? '비활성화'
                                : '활성화'}
                            </Button>
                          </form>
                        )}
                        {isSuper && (
                          <form
                            className="inline"
                            action={deleteUser.bind(null, profile.id)}
                          >
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                            >
                              삭제
                            </Button>
                          </form>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {!data?.length && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              조건에 맞는 사용자가 없습니다.
            </div>
          )}
          <div className="flex items-center justify-between border-t p-4 text-sm">
            <span>
              {page} / {pages} 페이지
            </span>
            <div className="flex gap-2">
              <a
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
                href={`?q=${params.q ?? ''}&page=${Math.max(1, page - 1)}`}
              >
                이전
              </a>
              <a
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
                href={`?q=${params.q ?? ''}&page=${Math.min(pages, page + 1)}`}
              >
                다음
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
