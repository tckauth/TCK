import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const stats = [
  { label: '활성 사용자', value: '1,284', note: '+8.2%', icon: Users },
  { label: '관리 작업', value: '47', note: '오늘', icon: ShieldCheck },
  { label: '서비스 상태', value: '정상', note: '99.99%', icon: CheckCircle2 },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="size-5" />
            </span>
            TCK Safety Hub
          </div>
          <Button nativeButton={false} render={<Link href="/login" />}>
            관리자 로그인 <ArrowRight />
          </Button>
        </div>
      </header>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-24">
        <div className="flex flex-col justify-center">
          <div className="mb-5 w-fit rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
            방문 · 공사 · TBM 통합 안전관리
          </div>
          <h1 className="max-w-2xl text-4xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            사업장 방문과 공사를
            <br />더 빠르고 안전하게.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            외부업체 방문 등록부터 TCK 담당자의 TBM 확인, 실시간 현황판과 안전
            게시판까지 하나의 서비스에서 관리합니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              콘솔 시작하기 <ArrowRight />
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/signup" />}
            >
              계정 만들기
            </Button>
          </div>
        </div>
        <div className="relative rounded-[2rem] border bg-card p-4 shadow-[0_30px_80px_-30px_oklch(0.32_0.12_252/.35)] sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">운영 현황</p>
              <h2 className="text-xl font-semibold">오늘의 대시보드</h2>
            </div>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-emerald-500" />
              실시간
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map(({ label, value, note, icon: Icon }) => (
              <Card key={label} className="shadow-none">
                <CardContent className="p-4">
                  <Icon className="mb-5 size-5 text-primary" />
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <div className="mt-1 flex items-end justify-between">
                    <strong className="text-xl">{value}</strong>
                    <span className="text-xs text-emerald-600">{note}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-3 rounded-xl border bg-muted/35 p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-medium">최근 활동</p>
              <span className="text-xs text-muted-foreground">감사 로그</span>
            </div>
            {[
              ['사용자 역할이 변경되었습니다', '2분 전'],
              ['서비스 설정이 업데이트되었습니다', '18분 전'],
              ['새 사용자가 가입했습니다', '1시간 전'],
            ].map(([label, time]) => (
              <div
                key={label}
                className="flex items-center gap-3 border-t py-3 text-sm first:border-0"
              >
                <span className="size-2 rounded-full bg-primary/70" />
                <span className="flex-1">{label}</span>
                <span className="text-xs text-muted-foreground">{time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
