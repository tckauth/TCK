import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { PublicSiteTitle } from '@/components/public/site-title';
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-10 flex items-center gap-3 font-semibold"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="size-5" />
            </span>
            <PublicSiteTitle />
          </Link>
          {children}
        </div>
      </section>
      <aside className="hidden bg-[radial-gradient(circle_at_25%_20%,oklch(0.62_0.17_250),transparent_40%),linear-gradient(145deg,oklch(0.28_0.1_255),oklch(0.16_0.04_260))] p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <blockquote className="max-w-xl text-3xl font-medium leading-tight">
          “권한과 기록이 명확할 때, 운영은 더 빠르고 안전해집니다.”
        </blockquote>
        <p className="mt-4 text-white/60">Aegis Operations Platform</p>
      </aside>
    </main>
  );
}
