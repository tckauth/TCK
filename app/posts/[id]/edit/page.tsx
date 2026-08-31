import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { requireUser } from '@/lib/auth/authorization';
import { updatePost } from '../../actions';
export default async function EditPost({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: post } = await supabase
    .from('posts')
    .select('id,title,content,author_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
  if (!post || post.author_id !== user.id) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold">게시글 수정</h1>
      <Card>
        <CardHeader>
          <CardTitle>내용 수정</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updatePost.bind(null, id)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                name="title"
                defaultValue={post.title}
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                name="content"
                defaultValue={post.content}
                rows={12}
                required
                maxLength={20000}
              />
            </div>
            <Button>수정 저장</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
