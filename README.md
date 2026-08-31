# Aegis Console

Supabase Auth/PostgreSQL과 Cloudflare Workers 런타임을 사용하는 반응형 사용자·권한 관리 콘솔입니다. RBAC, RLS, 관리자 사용자 관리, 감사 로그, 시스템 설정을 포함합니다.

## 기술 스택

- Next.js App Router 호환 Vinext, React 19, TypeScript strict, Tailwind CSS 4
- shadcn/ui, Base UI, Lucide Icons
- Supabase Auth, PostgreSQL, RLS, Storage-ready
- Cloudflare Workers/Pages, Wrangler

## 요구사항

- Node.js 22.13 이상
- pnpm 11 이상(권장) 또는 npm
- Supabase 프로젝트, Cloudflare 계정, GitHub 저장소

## 설치

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

npm을 사용하는 경우 `npm install`, `npm run dev`도 가능합니다. 저장소에는 재현 가능한 `pnpm-lock.yaml`이 포함됩니다.

## 환경변수

`.env.example`을 `.env.local`로 복사하고 값을 입력합니다.

| 변수 | 위치 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 브라우저/서버 | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 브라우저/서버 | 공개 anon key(RLS 적용) |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 | 관리자 사용자 생성·삭제. 브라우저 노출 금지 |
| `NEXT_PUBLIC_SITE_URL` | 브라우저/서버 | 로컬 또는 운영 Origin |

`.env*`, 빌드 산출물, Wrangler 상태 폴더는 Git에서 제외됩니다. Service Role Key는 절대 `NEXT_PUBLIC_` 접두사를 붙이지 마세요.

## Supabase 생성 및 마이그레이션

1. Supabase Dashboard에서 새 프로젝트를 생성합니다.
2. Authentication → URL Configuration에서 Site URL과 `/auth/callback`, `/reset-password` redirect URL을 등록합니다.
3. SQL Editor에서 `supabase/migrations/202608310001_initial_schema.sql` 전체를 실행합니다. 또는 Supabase CLI로 `supabase link --project-ref <ref>` 후 `supabase db push`를 실행합니다.
4. Authentication → Providers에서 Email을 활성화하고 운영 환경에서는 이메일 확인을 켭니다.
5. Storage가 필요한 서비스 기능을 추가할 때는 비공개 bucket과 객체 소유자 기반 RLS 정책을 먼저 만듭니다.

마이그레이션은 테이블, 인덱스, 제약조건, 트리거, 기본 역할/권한, 모든 중요 테이블의 RLS 정책을 한 번에 생성합니다.

## 최초 SUPER_ADMIN 생성

1. 앱 회원가입 또는 Supabase Authentication → Users에서 최초 계정을 생성합니다.
2. 이메일 인증을 완료합니다.
3. SQL Editor에서 이메일을 바꾸어 아래 쿼리를 1회 실행합니다.

```sql
update public.user_roles
set role_id = (select id from public.roles where name = 'SUPER_ADMIN')
where user_id = (select id from public.profiles where email = 'admin@example.com');
```

비밀번호는 코드나 seed 파일에 저장하지 않습니다. 이후 사용자는 콘솔의 사용자 생성 기능으로 만들 수 있으며, 임시 비밀번호를 노출하지 않고 비밀번호 설정 메일을 보냅니다.

## 로컬 실행과 검사

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
```

Supabase 로컬 개발을 사용할 경우 Supabase CLI 설치 후 `supabase start`, `supabase db reset`을 실행합니다.

## GitHub 연결

```bash
git init
git add .
git commit -m "feat: initialize Aegis Console"
git branch -M main
git remote add origin https://github.com/<owner>/<repository>.git
git push -u origin main
```

푸시 전에 `git grep -nE "service_role|SUPABASE_SERVICE_ROLE_KEY=.*[^=]"`로 실수로 포함된 secret이 없는지 확인하세요.

## Cloudflare 연결 및 배포

이 프로젝트는 Cloudflare Worker 호환 ESM을 생성합니다.

1. Cloudflare Dashboard → Workers & Pages → Create → Import a repository에서 GitHub 저장소를 연결합니다.
2. Build command를 `pnpm build`, 배포 산출물/Worker 설정은 빌드된 `dist/server/wrangler.json`을 사용합니다. CLI 배포 시 `pnpm build` 후 `wrangler deploy --config dist/server/wrangler.json`을 실행합니다.
3. Settings → Variables and Secrets에 공개 변수 두 개와 `NEXT_PUBLIC_SITE_URL`을 추가합니다.
4. `SUPABASE_SERVICE_ROLE_KEY`는 반드시 Secret(암호화)로 추가합니다. 로그에 값을 출력하지 마세요.
5. Production 브랜치를 `main`으로 지정하면 Git push → GitHub → Cloudflare 자동 빌드/배포 흐름이 완성됩니다.

Supabase Dashboard의 Auth URL 목록에도 실제 Cloudflare URL을 추가해야 이메일 인증과 비밀번호 재설정이 완료됩니다.

## Custom Domain

Workers & Pages 프로젝트 → Custom Domains → Set up a custom domain에서 `app.example.com`을 입력합니다. 도메인이 같은 Cloudflare 계정에 있으면 DNS 레코드와 인증서가 자동 구성됩니다. 외부 DNS를 사용하면 Cloudflare가 안내한 CNAME을 등록합니다. 연결 후 `NEXT_PUBLIC_SITE_URL`과 Supabase Auth Site URL/Redirect URL을 `https://app.example.com` 기준으로 갱신하고 재배포합니다.

## 권한과 보안

- `SUPER_ADMIN`: 모든 기능과 사용자 삭제
- `ADMIN`: 사용자 생성/수정, 역할 조회, 설정, 감사 로그
- `MANAGER`: 일반 사용자 조회
- `USER`: 일반 대시보드와 본인 정보

보호 페이지는 서버에서 세션을 확인하고, 관리자 작업은 서버 액션에서 역할을 다시 검증합니다. PostgreSQL RLS가 최종 데이터 경계를 강제합니다. Service Role client는 서버 전용 모듈에만 존재합니다. React 기본 escaping으로 사용자 입력을 HTML로 삽입하지 않으며, Zod와 Supabase query builder로 입력과 쿼리를 제한합니다.

## 문제 해결

- `Supabase ... not configured`: `.env.local` 값과 개발 서버 재시작을 확인합니다.
- 로그인 후 다시 로그인 화면: Auth redirect URL, 쿠키 도메인, HTTPS 여부를 확인합니다.
- 관리자 메뉴 접근 불가: `user_roles`와 `roles` 연결 및 이메일이 맞는지 확인합니다.
- Cloudflare 빌드 실패: Node 22+, pnpm 버전, `compatibility_flags = ["nodejs_compat"]`를 확인합니다.
- 사용자 생성 실패: Service Role Key가 Cloudflare Secret에 있고 anon key와 혼동하지 않았는지 확인합니다.
- RLS 오류: 정책을 끄지 말고 해당 계정 역할과 `has_role()` 결과를 확인합니다.

## 비용

GitHub, Cloudflare, Supabase 무료 티어를 기본으로 하며 유료 외부 API가 없습니다. 트래픽과 DB/Storage 사용량은 각 서비스 Dashboard에서 알림 임계값을 설정하세요.
