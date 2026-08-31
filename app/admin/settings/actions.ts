'use server';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/authorization';
export async function updateSettings(formData: FormData) {
  const { supabase, user } = await requireRole(['SUPER_ADMIN', 'ADMIN']);
  const titleValue = formData.get('site_title');
  const title = (typeof titleValue === 'string' ? titleValue : '').slice(
    0,
    100,
  );
  const maintenance = formData.get('maintenance_mode') === 'on';
  await supabase.from('system_settings').upsert(
    [
      {
        key: 'site_title',
        value: JSON.stringify(title),
        is_public: true,
        updated_by: user.id,
      },
      {
        key: 'maintenance_mode',
        value: JSON.stringify(maintenance),
        is_public: true,
        updated_by: user.id,
      },
    ],
    { onConflict: 'key' },
  );
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'CHANGE_SETTING',
    target_type: 'SYSTEM',
    description: '서비스 설정을 변경했습니다.',
  });
  revalidatePath('/admin/settings');
}
