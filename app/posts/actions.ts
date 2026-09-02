'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireRole } from '@/lib/auth/authorization';
export type PostResult = { ok: boolean; message: string };
const schema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(20000),
  postType: z.enum(['GENERAL', 'NOTICE', 'SURVEY', 'IMAGE', 'VIDEO']),
  externalVideoUrl: z.union([z.url(), z.literal('')]).optional(),
});
const allowed = new Map([
  ['image/jpeg', ['jpg', 'jpeg']],
  ['image/png', ['png']],
  ['image/gif', ['gif']],
  ['image/webp', ['webp']],
  ['video/mp4', ['mp4']],
  ['video/webm', ['webm']],
  ['video/quicktime', ['mov']],
]);
export async function createPost(
  _: PostResult,
  formData: FormData,
): Promise<PostResult> {
  const { supabase, user } = await requireRole(['SUPER_ADMIN']);
  const parsed = schema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
    postType: formData.get('postType'),
    externalVideoUrl: formData.get('externalVideoUrl'),
  });
  if (!parsed.success)
    return { ok: false, message: '제목, 내용, 유형을 확인하세요.' };
  const startsAtValue = formData.get('surveyStartsAt');
  const endsAtValue = formData.get('surveyEndsAt');
  const startsAt = typeof startsAtValue === 'string' ? new Date(startsAtValue) : null;
  const endsAt = typeof endsAtValue === 'string' ? new Date(endsAtValue) : null;
  if (
    parsed.data.postType === 'SURVEY' &&
    (!startsAt || !endsAt || Number.isNaN(startsAt.valueOf()) || Number.isNaN(endsAt.valueOf()) || startsAt >= endsAt)
  ) {
    return { ok: false, message: '설문 시작과 종료 시간을 올바르게 설정하세요.' };
  }
  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      title: parsed.data.title,
      content: parsed.data.content,
      post_type: parsed.data.postType,
      author_id: user.id,
      is_pinned: formData.get('isPinned') === 'on',
      external_video_url: parsed.data.externalVideoUrl || null,
    })
    .select('id')
    .single();
  if (error || !post)
    return { ok: false, message: '게시글을 저장하지 못했습니다.' };
  const file = formData.get('attachment');
  if (file instanceof File && file.size > 0) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const exts = allowed.get(file.type);
    if (!exts?.includes(ext) || file.size > 104857600) {
      await supabase.from('posts').delete().eq('id', post.id);
      return {
        ok: false,
        message: '허용되지 않은 파일 형식이거나 100MB를 초과했습니다.',
      };
    }
    const type = file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO';
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('post-attachments')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      await supabase.from('posts').delete().eq('id', post.id);
      return { ok: false, message: '첨부파일을 업로드하지 못했습니다.' };
    }
    await supabase.from('post_attachments').insert({
      post_id: post.id,
      file_name: file.name.slice(0, 255),
      file_path: path,
      file_type: type,
      file_size: file.size,
      mime_type: file.type,
    });
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'UPLOAD_FILE',
      target_type: 'POST',
      target_id: post.id,
      description: `${type} 첨부파일을 업로드했습니다.`,
    });
  }
  if (parsed.data.postType === 'SURVEY') {
    const questionValue = formData.get('surveyQuestion');
    const optionsValue = formData.get('surveyOptions');
    const question = (
      typeof questionValue === 'string' ? questionValue : ''
    ).trim();
    const options = (typeof optionsValue === 'string' ? optionsValue : '')
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean)
      .slice(0, 20);
    if (question && options.length >= 2) {
      const { data: survey } = await supabase
        .from('surveys')
        .insert({
          post_id: post.id,
          is_results_public: formData.get('resultsPublic') === 'on',
          starts_at: startsAt!.toISOString(),
          ends_at: endsAt!.toISOString(),
        })
        .select('id')
        .single();
      if (survey) {
        const { data: q } = await supabase
          .from('survey_questions')
          .insert({
            survey_id: survey.id,
            question_text: question,
            allow_multiple: formData.get('allowMultiple') === 'on',
          })
          .select('id')
          .single();
        if (q)
          await supabase.from('survey_options').insert(
            options.map((text, index) => ({
              question_id: q.id,
              option_text: text,
              sort_order: index,
            })),
          );
      }
    }
  }
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'CREATE_POST',
    target_type: 'POST',
    target_id: post.id,
    description: `${parsed.data.title} 게시글을 작성했습니다.`,
  });
  revalidatePath('/posts');
  redirect(`/posts/${post.id}`);
}
export async function deletePost(postId: string) {
  const { supabase, user } = await requireRole(['SUPER_ADMIN']);
  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single();
  if (!post || post.author_id !== user.id)
    throw new Error('삭제 권한이 없습니다.');
  await supabase
    .from('posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', postId);
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'DELETE_POST',
    target_type: 'POST',
    target_id: postId,
    description: '게시글을 삭제했습니다.',
  });
  revalidatePath('/posts');
  redirect('/posts');
}
export async function updatePost(postId: string, formData: FormData) {
  const { supabase, user } = await requireRole(['SUPER_ADMIN']);
  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single();
  if (!post || post.author_id !== user.id)
    throw new Error('수정 권한이 없습니다.');
  const titleValue = formData.get('title');
  const contentValue = formData.get('content');
  const title = typeof titleValue === 'string' ? titleValue.trim() : '';
  const content = typeof contentValue === 'string' ? contentValue.trim() : '';
  if (!title || title.length > 200 || !content || content.length > 20000)
    throw new Error('입력값을 확인하세요.');
  await supabase.from('posts').update({
    title,
    content,
    is_pinned: formData.get('isPinned') === 'on',
  }).eq('id', postId);
  await supabase
    .from('audit_logs')
    .insert({
      user_id: user.id,
      action: 'UPDATE_POST',
      target_type: 'POST',
      target_id: postId,
      description: `${title} 게시글을 수정했습니다.`,
    });
  revalidatePath(`/posts/${postId}`);
  redirect(`/posts/${postId}`);
}
export async function submitSurvey(surveyId: string, formData: FormData) {
  const { supabase, user } = await requireRole(['SUPER_ADMIN', 'TBM_ADMIN', 'VIEWER', 'VISITER']);
  const { data: survey } = await supabase
    .from('surveys')
    .select('starts_at,ends_at')
    .eq('id', surveyId)
    .single();
  const now = Date.now();
  if (!survey || (survey.starts_at && new Date(survey.starts_at).getTime() > now))
    throw new Error('아직 시작하지 않은 설문입니다.');
  if (survey.ends_at && new Date(survey.ends_at).getTime() <= now)
    throw new Error('종료된 설문입니다.');
  const selected = formData
    .getAll('option')
    .filter((v): v is string => typeof v === 'string');
  if (!selected.length) throw new Error('선택지를 고르세요.');
  const { data: question } = await supabase
    .from('survey_questions')
    .select('id,allow_multiple,survey_options(id)')
    .eq('survey_id', surveyId)
    .single();
  if (!question) throw new Error('설문이 없습니다.');
  if (!question.allow_multiple && selected.length > 1)
    throw new Error('하나만 선택할 수 있습니다.');
  const allowedIds = new Set(
    (question.survey_options as Array<{ id: string }>).map((o) => o.id),
  );
  if (selected.some((id) => !allowedIds.has(id)))
    throw new Error('잘못된 선택지입니다.');
  const { data: response, error } = await supabase
    .from('survey_responses')
    .insert({ survey_id: surveyId, user_id: user.id })
    .select('id')
    .single();
  if (error || !response)
    throw new Error('이미 응답했거나 제출할 수 없습니다.');
  await supabase.from('survey_answers').insert(
    selected.map((optionId) => ({
      response_id: response.id,
      question_id: question.id,
      option_id: optionId,
    })),
  );
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'SUBMIT_SURVEY',
    target_type: 'SURVEY',
    target_id: surveyId,
    description: '설문에 응답했습니다.',
  });
  revalidatePath('/posts');
}
