import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { requireUser, getRoles } from '@/lib/auth/authorization';
import { DeletePostButton } from '@/components/posts/delete-post-button';
import { submitSurvey } from '../actions';
export default async function PostDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { data: post } = await supabase
    .from('posts')
    .select('*,profiles(full_name,email),post_attachments(*)')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
  if (!post) notFound();
  void supabase
    .from('posts')
    .update({ view_count: post.view_count + 1 })
    .eq('id', id);
  const roles = await getRoles(user.id);
  const canDelete =
    post.author_id === user.id ||
    roles.some((r) => ['SUPER_ADMIN', 'ADMIN'].includes(r));
  const attachments = post.post_attachments as Array<{
    id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    mime_type: string;
  }>;
  const media = await Promise.all(
    attachments.map(async (a) => ({
      ...a,
      url:
        (
          await supabase.storage
            .from('post-attachments')
            .createSignedUrl(a.file_path, 3600)
        ).data?.signedUrl ?? '',
    })),
  );
  const { data: survey } =
    post.post_type === 'SURVEY'
      ? await supabase
          .from('surveys')
          .select(
            'id,is_results_public,survey_questions(id,question_text,allow_multiple,survey_options(id,option_text,sort_order))',
          )
          .eq('post_id', id)
          .single()
      : { data: null };
  let counts: Record<string, number> = {};
  let total = 0;
  if (
    survey &&
    (survey.is_results_public ||
      roles.some((r) => ['SUPER_ADMIN', 'ADMIN', 'TBM_MANAGER'].includes(r)))
  ) {
    const { data: answers } = await supabase
      .from('survey_answers')
      .select('option_id,survey_responses!inner(survey_id)')
      .eq('survey_responses.survey_id', survey.id);
    counts = (answers ?? []).reduce<Record<string, number>>(
      (acc, a) => ((acc[a.option_id] = (acc[a.option_id] ?? 0) + 1), acc),
      {},
    );
    const { count } = await supabase
      .from('survey_responses')
      .select('id', { count: 'exact', head: true })
      .eq('survey_id', survey.id);
    total = count ?? 0;
  }
  const question = (
    survey?.survey_questions as unknown as Array<{
      id: string;
      question_text: string;
      allow_multiple: boolean;
      survey_options: Array<{
        id: string;
        option_text: string;
        sort_order: number;
      }>;
    }>
  )?.[0];
  return (
    <article className="mx-auto max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Badge>{post.post_type}</Badge>
          <span className="text-xs text-muted-foreground">
            조회 {post.view_count + 1}
          </span>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{post.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {(
            post.profiles as unknown as {
              full_name: string | null;
              email: string;
            } | null
          )?.full_name ??
            (post.profiles as unknown as { email: string } | null)?.email}{' '}
          · {new Date(post.created_at).toLocaleString('ko-KR')}
        </p>
      </div>
      <Card className="shadow-none">
        <CardContent className="p-6">
          <div className="whitespace-pre-wrap leading-7">{post.content}</div>
          {media.map((a) => (
            <figure key={a.id} className="mt-6">
              {a.file_type === 'IMAGE' ? (
                <Image
                  src={a.url}
                  alt={a.file_name}
                  width={1200}
                  height={800}
                  unoptimized
                  className="max-h-[560px] w-auto rounded-xl border"
                />
              ) : (
                // oxlint-disable-next-line jsx-a11y/media-has-caption -- uploaded source may not include a captions track
                <video
                  src={a.url}
                  controls
                  className="w-full rounded-xl border"
                >
                  영상 재생을 지원하지 않는 브라우저입니다.
                </video>
              )}
              <a
                className={buttonVariants({
                  variant: 'outline',
                  className: 'mt-2',
                })}
                href={a.url}
                download
              >
                <Download />
                다운로드
              </a>
            </figure>
          ))}
          {post.external_video_url && (
            <a
              className="mt-6 block text-primary underline"
              href={post.external_video_url}
              target="_blank"
              rel="noreferrer"
            >
              외부 영상 보기
            </a>
          )}
        </CardContent>
      </Card>
      {survey && question && (
        <Card className="mt-6 shadow-none">
          <CardContent className="p-6">
            <Badge variant="outline">설문</Badge>
            <h2 className="mt-3 text-xl font-semibold">
              {question.question_text}
            </h2>
            <form
              action={submitSurvey.bind(null, survey.id)}
              className="mt-5 space-y-3"
            >
              {question.survey_options
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((o) => (
                  <label
                    key={o.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
                  >
                    <input
                      type={question.allow_multiple ? 'checkbox' : 'radio'}
                      name="option"
                      value={o.id}
                    />
                    <span className="flex-1">{o.option_text}</span>
                    {total > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {Math.round(((counts[o.id] ?? 0) / total) * 100)}%
                      </span>
                    )}
                  </label>
                ))}
              <Button>응답 제출</Button>
            </form>
            {total > 0 && (
              <div className="mt-6 space-y-3">
                <p className="font-medium">총 응답자 {total}명</p>
                {question.survey_options.map((o) => (
                  <div key={o.id}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{o.option_text}</span>
                      <span>{counts[o.id] ?? 0}</span>
                    </div>
                    <Progress value={((counts[o.id] ?? 0) / total) * 100} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {canDelete && (
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/posts/${id}/edit`} />}
          >
            수정
          </Button>
          <DeletePostButton id={id} />
        </div>
      )}
    </article>
  );
}
