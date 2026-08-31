import Link from 'next/link';
import { AuthForm } from '@/components/auth/auth-form';
import { login } from '../actions';
export default function LoginPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">
        다시 오신 것을 환영합니다
      </h1>
      <p className="mb-8 mt-2 text-muted-foreground">
        운영 콘솔에 로그인하세요.
      </p>
      <AuthForm mode="login" action={login} />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        계정이 없나요?{' '}
        <Link
          className="font-medium text-primary hover:underline"
          href="/signup"
        >
          회원가입
        </Link>
      </p>
    </>
  );
}
