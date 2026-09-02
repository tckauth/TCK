import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { requireRole } from '@/lib/auth/authorization';
import { formatSeoulDate } from '@/lib/date-time';
export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
}) {
  const { supabase, roles } = await requireRole(['SUPER_ADMIN', 'TBM_ADMIN', 'VIEWER', 'VISITER']);
  const p = await searchParams;
  const page = Math.max(1, Number(p.page) || 1);
  const size = 12;
  let query = supabase
    .from('posts')
    .select(
      'id,title,content,post_type,is_pinned,view_count,created_at,profiles(full_name,email)',
      { count: 'exact' },
    )
    .is('deleted_at', null)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range((page - 1) * size, page * size - 1);
  if (p.q)
    query = query.or(
      `title.ilike.%${p.q.replaceAll(/[%,()]/g, '')}%,content.ilike.%${p.q.replaceAll(/[%,()]/g, '')}%`,
    );
  if (p.type) query = query.eq('post_type', p.type);
  const { data, count } = await query;
  const pages = Math.max(1, Math.ceil((count ?? 0) / size));
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-primary">COMMUNITY</p>
          <h1 className="text-3xl font-bold tracking-tight">게시판</h1>
          <p className="mt-2 text-muted-foreground">
            공지, 자료, 영상과 설문을 확인하세요.
          </p>
        </div>
        {roles.includes('SUPER_ADMIN') && (
          <Button nativeButton={false} render={<Link href="/posts/new" />}>
            <Plus />
            글쓰기
          </Button>
        )}
      </div>
      <Card className="mb-4 shadow-none">
        <CardContent className="p-4">
          <form className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={p.q}
                placeholder="제목 또는 내용 검색"
                className="pl-9"
              />
            </div>
            <NativeSelect name="type" defaultValue={p.type ?? ''}>
              <NativeSelectOption value="">전체 유형</NativeSelectOption>
              {['GENERAL', 'NOTICE', 'SURVEY', 'IMAGE', 'VIDEO'].map((t) => (
                <NativeSelectOption key={t} value={t}>
                  {t}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Button type="submit">검색</Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-3">
        {data?.map((post) => {
          const author = post.profiles as unknown as {
            full_name: string | null;
            email: string;
          } | null;
          return (
            <Link href={`/posts/${post.id}`} key={post.id}>
              <Card className="shadow-none transition hover:border-primary/40">
                <CardContent className="flex gap-4 p-5">
                  <Badge
                    variant={
                      post.post_type === 'NOTICE' ? 'default' : 'outline'
                    }
                    className="h-fit"
                  >
                    {post.post_type}
                  </Badge>
                  {post.is_pinned && <Badge variant="outline" className="h-fit">상단 고정</Badge>}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold">{post.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {post.content}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {author?.full_name ?? author?.email} ·{' '}
                      {formatSeoulDate(post.created_at)} ·
                      조회 {post.view_count}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {!data?.length && (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              게시글이 없습니다.
            </CardContent>
          </Card>
        )}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <a
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
          href={`?q=${p.q ?? ''}&type=${p.type ?? ''}&page=${Math.max(1, page - 1)}`}
        >
          이전
        </a>
        <span className="px-2 py-1 text-sm">
          {page}/{pages}
        </span>
        <a
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
          href={`?q=${p.q ?? ''}&type=${p.type ?? ''}&page=${Math.min(pages, page + 1)}`}
        >
          다음
        </a>
      </div>
    </div>
  );
}
