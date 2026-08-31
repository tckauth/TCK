'use server';
import { revalidatePath } from 'next/cache';
import { requireRole, requireUser, getRoles } from '@/lib/auth/authorization';
import { visitSchema } from '@/lib/validation/visit';
export type VisitResult = { ok: boolean; message: string };
const formVisit = (formData: FormData) => ({
  visitDate: formData.get('visitDate'),
  companyName: formData.get('companyName'),
  purpose: formData.get('purpose'),
  visitorCount: formData.get('visitorCount'),
  constructionLocation: formData.get('constructionLocation'),
  tckManagerId: formData.get('tckManagerId'),
  constructionYn: formData.get('constructionYn'),
});
export async function createVisit(
  _: VisitResult,
  formData: FormData,
): Promise<VisitResult> {
  const { supabase, user } = await requireUser();
  const parsed = visitSchema.safeParse(formVisit(formData));
  if (!parsed.success)
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? '입력값을 확인하세요.',
    };
  const { error } = await supabase.from('visits').insert({
    visit_date: parsed.data.visitDate,
    company_name: parsed.data.companyName,
    purpose: parsed.data.purpose,
    visitor_count: parsed.data.visitorCount,
    construction_location: parsed.data.constructionLocation,
    tck_manager_id: parsed.data.tckManagerId,
    construction_yn: parsed.data.constructionYn,
    tbm_yn: null,
    created_by: user.id,
    updated_by: user.id,
  });
  if (error)
    return {
      ok: false,
      message: '등록하지 못했습니다. 담당자와 입력값을 확인하세요.',
    };
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'CREATE_VISIT',
    target_type: 'VISIT',
    description: `${parsed.data.companyName} 방문/공사를 등록했습니다.`,
  });
  revalidatePath('/visits');
  revalidatePath('/board');
  return { ok: true, message: '방문/공사 정보가 등록되었습니다.' };
}
export async function changeTbm(visitId: string, value: 'O' | 'X' | null) {
  const { supabase, user } = await requireRole([
    'SUPER_ADMIN',
    'ADMIN',
    'TBM_MANAGER',
  ]);
  const { data: before } = await supabase
    .from('visits')
    .select('tbm_yn,company_name')
    .eq('id', visitId)
    .single();
  const { error } = await supabase
    .from('visits')
    .update({ tbm_yn: value, updated_by: user.id })
    .eq('id', visitId)
    .is('deleted_at', null);
  if (error) throw new Error('TBM 상태를 변경하지 못했습니다.');
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'CHANGE_TBM',
    target_type: 'VISIT',
    target_id: visitId,
    description: `${before?.company_name ?? '방문건'} TBM: ${before?.tbm_yn ?? '미입력'} → ${value ?? '미입력'}`,
  });
  revalidatePath('/visits');
  revalidatePath('/board');
}
export async function updateVisit(
  visitId: string,
  _: VisitResult,
  formData: FormData,
): Promise<VisitResult> {
  const { supabase, user } = await requireUser();
  const roles = await getRoles(user.id);
  const staff = roles.some((r) =>
    ['SUPER_ADMIN', 'ADMIN', 'TBM_MANAGER'].includes(r),
  );
  const parsed = visitSchema.safeParse(formVisit(formData));
  if (!parsed.success) return { ok: false, message: '입력값을 확인하세요.' };
  let query = supabase
    .from('visits')
    .update({
      visit_date: parsed.data.visitDate,
      company_name: parsed.data.companyName,
      purpose: parsed.data.purpose,
      visitor_count: parsed.data.visitorCount,
      construction_location: parsed.data.constructionLocation,
      tck_manager_id: parsed.data.tckManagerId,
      construction_yn: parsed.data.constructionYn,
      updated_by: user.id,
    })
    .eq('id', visitId)
    .is('deleted_at', null);
  if (!staff) query = query.eq('created_by', user.id);
  const { error } = await query;
  if (error)
    return { ok: false, message: '수정 권한이 없거나 저장하지 못했습니다.' };
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'UPDATE_VISIT',
    target_type: 'VISIT',
    target_id: visitId,
    description: `${parsed.data.companyName} 방문건을 수정했습니다.`,
  });
  revalidatePath('/visits');
  return { ok: true, message: '수정되었습니다.' };
}
export async function deleteVisit(visitId: string) {
  const { supabase, user } = await requireRole([
    'SUPER_ADMIN',
    'ADMIN',
    'TBM_MANAGER',
  ]);
  const { error } = await supabase
    .from('visits')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
      updated_by: user.id,
    })
    .eq('id', visitId);
  if (error) throw new Error('삭제하지 못했습니다.');
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'DELETE_VISIT',
    target_type: 'VISIT',
    target_id: visitId,
    description: '방문/공사 데이터를 삭제했습니다.',
  });
  revalidatePath('/visits');
}
