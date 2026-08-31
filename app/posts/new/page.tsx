import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PostForm } from '@/components/posts/post-form';
export default function NewPostPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm font-medium text-primary">COMMUNITY</p>
      <h1 className="text-3xl font-bold tracking-tight">게시글 작성</h1>
      <p className="mb-6 mt-2 text-muted-foreground">
        공지, 미디어, 설문을 한 곳에서 작성합니다.
      </p>
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>새 게시글</CardTitle>
        </CardHeader>
        <CardContent>
          <PostForm />
        </CardContent>
      </Card>
    </div>
  );
}
