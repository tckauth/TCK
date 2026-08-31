import Link from 'next/link';
import { AuthForm } from '@/components/auth/auth-form';
import { signup } from '../actions';
export default function SignupPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">계정 만들기</h1>
      <p className="mb-8 mt-2 text-muted-foreground">
        이메일 인증 후 바로 시작할 수 있습니다.
      </p>
      <AuthForm mode="signup" action={signup} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        이미 계정이 있나요?{' '}
        <Link
          className="font-medium text-primary hover:underline"
          href="/login"
        >
          로그인
        </Link>
      </p>
    </>
  );
}
