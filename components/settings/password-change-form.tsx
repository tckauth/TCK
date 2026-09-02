'use client';

import { useActionState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { changePassword } from '@/app/settings/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PasswordChangeForm() {
  const [state, action, pending] = useActionState(changePassword, { ok: false, message: '' });
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPassword">새 비밀번호</Label>
        <Input id="newPassword" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,72}" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="passwordConfirmation">새 비밀번호 확인</Label>
        <Input id="passwordConfirmation" name="passwordConfirmation" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
      </div>
      <p className="text-xs text-muted-foreground">8자 이상이며 대문자·소문자·숫자·특수문자를 각각 1개 이상 포함해야 합니다.</p>
      {state.message && <output className={`block rounded-lg p-3 text-sm ${state.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{state.message}</output>}
      <Button type="submit" disabled={pending}>{pending && <LoaderCircle className="animate-spin" />}비밀번호 변경</Button>
    </form>
  );
}
