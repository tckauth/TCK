'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
export default function ResetPasswordPage() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: {
    preventDefault(): void;
    currentTarget: HTMLFormElement;
  }) {
    event.preventDefault();
    setBusy(true);
    const data = new FormData(event.currentTarget);
    const value = data.get('password');
    const password = typeof value === 'string' ? value : '';
    if (password.length < 8) {
      setMessage('비밀번호는 8자 이상이어야 합니다.');
      setBusy(false);
      return;
    }
    const { error } = await createClient().auth.updateUser({ password });
    if (error)
      setMessage(
        '비밀번호를 변경하지 못했습니다. 링크가 만료되었을 수 있습니다.',
      );
    else router.replace('/dashboard');
    setBusy(false);
  }
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">새 비밀번호 설정</h1>
      <p className="mb-8 mt-2 text-muted-foreground">
        다른 사이트에서 사용하지 않는 안전한 비밀번호를 입력하세요.
      </p>
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password">새 비밀번호</Label>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
          />
        </div>
        {message && (
          <p role="alert" className="text-sm text-destructive">
            {message}
          </p>
        )}
        <Button className="w-full" size="lg" disabled={busy}>
          비밀번호 변경
        </Button>
      </form>
    </>
  );
}
