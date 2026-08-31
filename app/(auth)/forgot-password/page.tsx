import { AuthForm } from '@/components/auth/auth-form';
import { requestReset } from '../actions';
export default function ForgotPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">비밀번호 재설정</h1>
      <p className="mb-8 mt-2 text-muted-foreground">
        가입한 이메일로 안전한 재설정 링크를 보내드립니다.
      </p>
      <AuthForm mode="reset" action={requestReset} />
    </>
  );
}
