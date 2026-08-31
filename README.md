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
3. SQL Editor에서 `supabase/migrations`의 파일을 파일명 순서대로 실행합니다. 또는 Supabase CLI로 `supabase link --project-ref <ref>` 후 `supabase db push`를 실행합니다.
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

## TCK 방문·공사·TBM 확장

두 번째 migration인 `202608310002_tck_visit_tbm.sql`은 다음 기능을 추가합니다.

- 역할: `SUPER_ADMIN`, `ADMIN`, `TBM_MANAGER`, `VIEWER`, `EXTERNAL`
- 신규 회원 기본 역할: `EXTERNAL`
- 방문/공사 등록, 서버 검색·필터·페이지네이션, Soft Delete
- TBM `NULL/O/X` 제약조건과 담당 권한자의 서버 측 변경 검증
- 외부업체 작성자 소유권 기반 RLS
- Realtime 현황판과 TBM별 행 색상
- CSV 조건부 내보내기
- 게시판, 이미지·영상 첨부, private Storage signed URL
- 단일/복수 선택 설문, 사용자별 중복 응답 차단, 결과 집계

기존 DB를 확장할 때 migration 파일을 순서대로 적용합니다.

```bash
supabase db push
supabase test db
```

Supabase Dashboard → Database → Replication에서 `visits`가 Realtime publication에 포함되었는지 확인합니다. SQL migration이 자동으로 추가하지만 프로젝트 정책에 따라 Dashboard 확인이 필요할 수 있습니다.

### 업로드 정책

- 이미지: JPEG, PNG, GIF, WebP
- 영상: MP4, WebM, MOV
- 최대 크기: 100MB
- 저장 경로: `<user-id>/<uuid>.<validated-extension>`
- bucket은 비공개이며 로그인한 사용자에게 1시간 signed URL을 발급합니다.

Cloudflare의 요청 본문 제한이 Supabase의 100MB보다 작을 수 있습니다. 운영에서 큰 영상을 주로 사용한다면 Supabase signed upload URL을 이용한 직접 업로드 방식으로 전환하거나 외부 영상 URL을 사용하세요.

### 권한 검증

| 작업 | SUPER_ADMIN | ADMIN | TBM_MANAGER | VIEWER | EXTERNAL |
|---|---:|---:|---:|---:|---:|
| 전체 방문 조회 | O | O | O | O | X |
| 본인 방문 등록/조회 | O | O | O | O | O |
| TBM 변경 | O | O | O | X | X |
| 방문 수정·삭제 | O | O | O | X | 본인 수정만 |
| 사용자/시스템 관리 | O | O | X | X | X |

화면에서 버튼을 숨기는 것과 별개로 서버 액션과 PostgreSQL RLS가 동일 권한을 다시 검증합니다. `supabase/tests/acceptance.sql`에는 schema·제약조건·중복 설문 방지 테스트가 포함되어 있습니다.

### PostgreSQL 접속

Supabase Dashboard의 **Project Settings → Database → Connect**에서 연결 문자열을 복사합니다. 장시간 실행되는 서버나 마이그레이션에는 Direct connection 또는 Session pooler를, Cloudflare Workers 같은 서버리스 런타임에는 IPv4 호환 Transaction pooler를 사용합니다. 모든 연결은 `sslmode=require`로 암호화하고 DB 비밀번호는 브라우저용 환경변수에 넣지 않습니다.

```bash
# Supabase CLI를 통한 마이그레이션/SQL 작업
supabase link --project-ref <project-ref>
supabase db push

# psql 직접 접속 예시(실제 값은 Dashboard의 Connect에서 복사)
psql "postgresql://postgres.<project-ref>:<password>@<pooler-host>:5432/postgres?sslmode=require"
```

애플리케이션의 일반 데이터 요청은 PostgreSQL TCP에 직접 연결하지 않고 `NEXT_PUBLIC_SUPABASE_URL`과 anon key를 사용하는 Supabase HTTPS API를 거칩니다. 따라서 Cloudflare Workers에서도 RLS가 적용된 상태로 동작합니다.
