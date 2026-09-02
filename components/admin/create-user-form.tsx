'use client';
import { useActionState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { createUser } from '@/app/admin/users/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
export function CreateUserForm() {
  const [state, action, pending] = useActionState(createUser, {
    ok: false,
    message: '',
  });
  return (
    <form action={action} className="grid gap-4">
      <div>
        <Label htmlFor="fullName">이름</Label>
        <Input id="fullName" name="fullName" required />
      </div>
      <div>
        <Label htmlFor="email">이메일</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="role">역할</Label>
        <NativeSelect id="role" name="role" defaultValue="VIEWER">
          {[
            'VISITER',
            'VIEWER',
            'TBM_ADMIN',
            'APPR_ADMIN',
            'AUDIT_ADMIN',
            'SUPER_ADMIN',
          ].map(
            (role) => (
              <NativeSelectOption key={role} value={role}>
                {role}
              </NativeSelectOption>
            ),
          )}
        </NativeSelect>
      </div>
      {state.message && (
        <p
          className={
            state.ok ? 'text-sm text-emerald-600' : 'text-sm text-destructive'
          }
        >
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending && <LoaderCircle className="animate-spin" />}사용자 생성
      </Button>
    </form>
  );
}
