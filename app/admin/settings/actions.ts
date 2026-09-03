'use server';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/authorization';
import { invalidateRuntimeSettings } from '@/lib/settings';
export async function updateSettings(formData: FormData) {
  const { supabase, user } = await requireRole(['SUPER_ADMIN']);
  const titleValue = formData.get('site_title');
  const title = (typeof titleValue === 'string' ? titleValue : '').slice(
    0,
    100,
  );
  const maintenance = formData.get('maintenance_mode') === 'on';
  const timeoutValue = Number(formData.get('session_timeout_minutes'));
  const sessionTimeout = Number.isInteger(timeoutValue)
    ? Math.min(1440, Math.max(1, timeoutValue))
    : 10;
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
      {
        key: 'session_timeout_minutes',
        value: JSON.stringify(sessionTimeout),
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
  invalidateRuntimeSettings();
  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout');
}
