'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AuthState } from '@/app/(auth)/actions';

export function AuthForm({
  mode,
  action,
}: {
  mode: 'login' | 'signup' | 'reset';
  action: (state: AuthState, data: FormData) => Promise<AuthState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-5">
      {mode === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="fullName">이름</Label>
          <Input id="fullName" name="fullName" required autoComplete="name" />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
        />
      </div>
      {mode !== 'reset' && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="password">비밀번호</Label>
            {mode === 'login' && (
              <Link
                className="text-xs text-primary hover:underline"
                href="/forgot-password"
              >
                비밀번호 찾기
              </Link>
            )}
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
            autoComplete={
              mode === 'login' ? 'current-password' : 'new-password'
            }
          />
          {mode === 'signup' && (
            <p className="text-xs text-muted-foreground">
              비밀번호는 8자 이상 입력해 주세요.
            </p>
          )}
        </div>
      )}
      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}
      {state.success && (
        <output className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700">
          {state.success}
        </output>
      )}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={pending}
      >
        {pending && <LoaderCircle className="animate-spin" />}
        {mode === 'login'
          ? '로그인'
          : mode === 'signup'
            ? '계정 만들기'
            : '재설정 메일 보내기'}
      </Button>
    </form>
  );
}
