import Link from 'next/link';
import { Wrench } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export default function MaintenancePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 p-6">
      <section className="max-w-lg rounded-2xl border bg-background p-10 text-center shadow-sm">
        <Wrench className="mx-auto mb-5 size-10 text-primary" />
        <h1 className="text-2xl font-bold">서비스 점검 중입니다</h1>
        <p className="mt-3 text-muted-foreground">안정적인 서비스 제공을 위해 유지보수를 진행하고 있습니다. 잠시 후 다시 접속해 주세요.</p>
        <Link href="/login" className={`${buttonVariants({ variant: 'outline' })} mt-6`}>로그인 화면</Link>
      </section>
    </main>
  );
}
