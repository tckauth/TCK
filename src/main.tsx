/* oxlint-disable typescript/no-explicit-any, typescript/no-deprecated, typescript/no-base-to-string, typescript/no-floating-promises, typescript/no-useless-default-assignment, react/react-compiler, next/no-img-element, jsx-a11y/media-has-caption */
import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  BarChart3,
  BookOpen,
  CalendarPlus,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Monitor,
  Paperclip,
  Pin,
  PlaySquare,
  Image as ImageIcon,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { supabase } from './supabase';
import './spa.css';

type Role =
  | 'SUPER_ADMIN'
  | 'AUDIT_ADMIN'
  | 'APPR_ADMIN'
  | 'TBM_ADMIN'
  | 'VIEWER'
  | 'VISITER';
type Context = {
  user: any;
  profile: any;
  roles: Role[];
  siteTitle: string;
  timeout: number;
};
const allowed: Record<string, Role[]> = {
  '/dashboard': [
    'SUPER_ADMIN',
    'AUDIT_ADMIN',
    'APPR_ADMIN',
    'TBM_ADMIN',
    'VIEWER',
    'VISITER',
  ],
  '/visits': ['SUPER_ADMIN', 'TBM_ADMIN', 'VIEWER', 'VISITER'],
  '/visits/new': ['SUPER_ADMIN', 'TBM_ADMIN', 'VISITER'],
  '/board': ['SUPER_ADMIN', 'TBM_ADMIN', 'VIEWER'],
  '/posts': ['SUPER_ADMIN', 'TBM_ADMIN', 'VIEWER', 'VISITER'],
  '/surveys': [
    'SUPER_ADMIN',
    'AUDIT_ADMIN',
    'APPR_ADMIN',
    'TBM_ADMIN',
    'VIEWER',
    'VISITER',
  ],
  '/surveys/new': ['SUPER_ADMIN', 'TBM_ADMIN', 'VIEWER', 'VISITER'],
  '/admin/users': ['SUPER_ADMIN', 'APPR_ADMIN'],
  '/admin/roles': ['SUPER_ADMIN'],
  '/admin/settings': ['SUPER_ADMIN'],
  '/admin/logs': ['SUPER_ADMIN', 'AUDIT_ADMIN'],
  '/settings': [
    'SUPER_ADMIN',
    'AUDIT_ADMIN',
    'APPR_ADMIN',
    'TBM_ADMIN',
    'VIEWER',
    'VISITER',
  ],
};
const nav = [
  ['/dashboard', '대시보드', LayoutDashboard],
  ['/visits', '방문/공사 현황', ClipboardCheck],
  ['/visits/new', '방문/공사 등록', CalendarPlus],
  ['/board', '현황판', Monitor],
  ['/posts', '게시판', BookOpen],
  ['/surveys', '설문', BarChart3],
  ['/admin/users', '사용자 관리', Users],
  ['/admin/roles', '권한 관리', ShieldCheck],
  ['/admin/settings', '서비스 설정', SlidersHorizontal],
  ['/admin/logs', '시스템 로그', Activity],
  ['/settings', '내 설정', Settings],
] as const;
const seoulDate = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    new Date(),
  );
const fmt = (v: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(v));
const fmtDate = (v: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(v));
const loginDevice = () =>
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    ? '모바일'
    : 'PC';
const go = (path: string) => {
  history.pushState({}, '', path);
  dispatchEvent(new PopStateEvent('popstate'));
};
const A = ({
  href,
  children,
  className = '',
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onNavigate?: () => void;
}) => (
  <a
    href={href}
    className={className}
    onClick={(e) => {
      e.preventDefault();
      onNavigate?.();
      go(href);
    }}
  >
    {children}
  </a>
);
const Btn = ({
  children,
  ...p
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...p} className={`btn ${p.className ?? ''}`}>
    {children}
  </button>
);
const Card = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => <section className={`card ${className}`}>{children}</section>;
const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <label className="field">
    <span>{label}</span>
    {children}
  </label>
);
const Notice = ({
  children,
  ok = false,
}: {
  children: string;
  ok?: boolean;
}) =>
  children ? <p className={ok ? 'notice ok' : 'notice'}>{children}</p> : null;

function PublicHome() {
  const [stats, setStats] = useState<any>({});
  useEffect(() => {
    supabase.rpc('public_home_stats').then(({ data }) => setStats(data ?? {}));
  }, []);
  return (
    <main className="public">
      <div className="brand">
        <img className="tck-logo" src="/tck-logo.png" alt="TCK" />
        <span>TCK Safety</span>
      </div>
      <div className="hero">
        <p className="eyebrow">TCK EHS PLATFORM</p>
        <h1>
          <span>안전한 현장을 위한</span>
          <span>하나의 운영 공간</span>
        </h1>
        <p>방문·공사 등록, TBM 현황, 공지와 설문을 통합 관리합니다.</p>
        <div className="actions">
          <A href="/login" className="btn primary">
            로그인
          </A>
          <A href="/signup" className="btn">
            회원가입
          </A>
        </div>
      </div>
      <div className="stats">
        <Card>
          <b>{stats.active_users ?? '—'}</b>
          <span>활성 사용자</span>
        </Card>
        <Card>
          <b>{stats.admin_actions_today ?? '—'}</b>
          <span>오늘 관리 작업</span>
        </Card>
        <Card>
          <b>{stats.service_status ?? '확인 중'}</b>
          <span>서비스 상태</span>
        </Card>
      </div>
    </main>
  );
}
function AuthPage({ signup = false }: { signup?: boolean }) {
  const [msg, setMsg] = useState('');
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg('처리 중...');
    const f = new FormData(e.currentTarget),
      email = String(f.get('email')),
      password = String(f.get('password'));
    if (signup) {
      if (
        !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(
          password,
        )
      ) {
        setMsg(
          '비밀번호는 8자 이상이며 영문 대·소문자, 숫자, 특수문자를 각각 포함해야 합니다.',
        );
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: String(f.get('name')) } },
      });
      setMsg(
        error
          ? error.message
          : '가입 신청이 완료되었습니다. 승인 후 로그인할 수 있습니다.',
      );
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMsg('이메일 또는 비밀번호를 확인하세요.');
        return;
      }
      const { data: ctx } = await supabase.rpc('current_user_context');
      if (ctx?.status !== 'ACTIVE') {
        await supabase.auth.signOut();
        setMsg('관리자의 가입 승인이 필요합니다.');
        return;
      }
      await supabase
        .from('profiles')
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq('id', data.user.id);
      await supabase.from('audit_logs').insert({
        user_id: data.user.id,
        action: 'LOGIN',
        target_type: 'AUTH',
        target_id: data.user.id,
        description: `${loginDevice()}에서 로그인했습니다.`,
      });
      location.href = '/dashboard';
    }
  };
  return (
    <main className="auth">
      <A href="/" className="brand">
        <img className="tck-logo" src="/tck-logo.png" alt="TCK" />
        <span>TCK Safety</span>
      </A>
      <Card>
        <h1>{signup ? '회원가입' : '로그인'}</h1>
        <p>
          {signup
            ? '가입 후 APPR_ADMIN의 승인이 필요합니다.'
            : '계정으로 안전관리 서비스에 접속하세요.'}
        </p>
        <form onSubmit={submit}>
          {signup && (
            <Field label="사용자명">
              <input name="name" required />
            </Field>
          )}
          <Field label="이메일">
            <input name="email" type="email" required />
          </Field>
          <Field label="비밀번호">
            <input name="password" type="password" minLength={8} required />
          </Field>
          {signup && (
            <small>8자 이상 · 영문 대문자/소문자 · 숫자 · 특수문자 포함</small>
          )}
          <Notice>{msg}</Notice>
          <Btn type="submit">{signup ? '계정 만들기' : '로그인'}</Btn>
        </form>
        <A href={signup ? '/login' : '/signup'}>
          {signup ? '로그인으로 돌아가기' : '회원가입'}
        </A>
      </Card>
    </main>
  );
}

function Shell({ ctx, children }: { ctx: Context; children: React.ReactNode }) {
  const [mobile, setMobile] = useState(false);
  const closeMobileMenu = useCallback(() => setMobile(false), []);
  const visible = nav.filter(([p]) =>
    (allowed[p] ?? []).some((r) => ctx.roles.includes(r)),
  );
  useEffect(() => {
    let timer: number;
    const reset = () => {
      clearTimeout(timer);
      timer = window.setTimeout(async () => {
        await supabase.auth.signOut();
        location.href = '/login';
      }, ctx.timeout * 60000);
    };
    ['click', 'keydown', 'touchstart'].forEach((x) =>
      addEventListener(x, reset),
    );
    reset();
    return () =>
      ['click', 'keydown', 'touchstart'].forEach((x) =>
        removeEventListener(x, reset),
      );
  }, [ctx.timeout]);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobileMenu();
    };
    addEventListener('popstate', closeMobileMenu);
    addEventListener('keydown', closeOnEscape);
    return () => {
      removeEventListener('popstate', closeMobileMenu);
      removeEventListener('keydown', closeOnEscape);
    };
  }, [closeMobileMenu]);
  return (
    <div className="shell">
      {mobile && (
        <button
          type="button"
          className="menu-backdrop"
          aria-label="메뉴 닫기"
          onClick={closeMobileMenu}
        />
      )}
      <aside id="mobile-navigation" className={mobile ? 'open' : ''}>
        <A href="/dashboard" className="logo" onNavigate={closeMobileMenu}>
          <img className="tck-logo" src="/tck-logo.png" alt="TCK" />
          <span>{ctx.siteTitle}</span>
        </A>
        <nav>
          {visible.map(([p, l, I]) => (
            <A key={p} href={p} onNavigate={closeMobileMenu}>
              <I />
              {l}
            </A>
          ))}
        </nav>
        <footer>
          TCK의 안전은
          <br />
          귀하의 손에 달려있습니다
        </footer>
      </aside>
      <div className="workspace">
        <header>
          <Btn
            className="menu"
            aria-label={mobile ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={mobile}
            aria-controls="mobile-navigation"
            onClick={() => setMobile((open) => !open)}
          >
            <Menu />
          </Btn>
          <span>운영 워크스페이스</span>
          <div className="account-summary">
            <span>
              <b>{ctx.user.email}</b>
              <small>({ctx.profile?.full_name || '사용자명 없음'})</small>
            </span>
            <Btn
              aria-label="로그아웃"
              onClick={async () => {
                await supabase.auth.signOut();
                location.href = '/login';
              }}
            >
              <LogOut />
            </Btn>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
function Title({
  over,
  title,
  desc,
  action,
}: {
  over: string;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="title">
      <div>
        <p className="eyebrow">{over}</p>
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
      </div>
      {action}
    </div>
  );
}

function Dashboard({ ctx }: { ctx: Context }) {
  const [data, setData] = useState<any>({
    visits: 0,
    people: 0,
    tbm: 0,
    posts: 0,
  });
  useEffect(() => {
    const d = seoulDate();
    Promise.all([
      supabase
        .from('visits')
        .select('visitor_count,tbm_yn')
        .lte('visit_date', d)
        .gte('visit_end_date', d)
        .is('deleted_at', null),
      supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .is('deleted_at', null),
    ]).then(([v, p]) =>
      setData({
        visits: v.data?.length ?? 0,
        people: v.data?.reduce((s, x) => s + x.visitor_count, 0) ?? 0,
        tbm: v.data?.filter((x) => x.tbm_yn === 'O').length ?? 0,
        posts: p.count ?? 0,
      }),
    );
  }, []);
  return (
    <>
      <Title
        over="OVERVIEW"
        title={`안녕하세요, ${ctx.profile?.full_name || '사용자'}님`}
        desc="오늘의 안전관리 현황입니다."
      />
      <div className="metrics">
        {[
          ['오늘 방문', data.visits],
          ['방문 인원', data.people],
          ['TBM 완료', data.tbm],
          ['게시물', data.posts],
        ].map(([l, v]) => (
          <Card key={l}>
            <b>{v}</b>
            <span>{l}</span>
          </Card>
        ))}
      </div>
    </>
  );
}

function Visits({ ctx, newMode = false }: { ctx: Context; newMode?: boolean }) {
  const [rows, setRows] = useState<any[]>([]),
    [managers, setManagers] = useState<any[]>([]),
    [msg, setMsg] = useState('');
  const [from, setFrom] = useState(seoulDate()),
    [to, setTo] = useState(seoulDate());
  const load = useCallback(async () => {
    const [{ data }, { data: m }] = await Promise.all([
      supabase
        .from('visits')
        .select('*')
        .lte('visit_date', to)
        .gte('visit_end_date', from)
        .is('deleted_at', null)
        .order('visit_date'),
      supabase.rpc('list_tck_managers'),
    ]);
    setRows(data ?? []);
    setManagers(m ?? []);
  }, [from, to]);
  useEffect(() => {
    load();
  }, [load]);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = {
      visit_date: f.get('start'),
      visit_end_date: f.get('end'),
      company_name: String(f.get('company')).trim(),
      purpose: String(f.get('purpose')).trim(),
      visitor_count: Number(f.get('count')),
      construction_location: String(f.get('location')).trim(),
      tck_manager_id: f.get('manager'),
      construction_yn: f.get('construction') === 'true',
      tbm_yn: 'X',
      created_by: ctx.user.id,
      updated_by: ctx.user.id,
    };
    if (
      !payload.company_name ||
      !payload.purpose ||
      !payload.construction_location ||
      !payload.tck_manager_id ||
      payload.visit_end_date! < payload.visit_date!
    ) {
      setMsg('모든 항목과 날짜 범위를 확인하세요.');
      return;
    }
    const { error } = await supabase.from('visits').insert(payload);
    if (error) {
      setMsg(error.message);
      return;
    }
    window.alert('등록되었습니다.');
    go('/visits');
  };
  if (newMode)
    return (
      <>
        <Title
          over="NEW VISIT"
          title="방문/공사 등록"
          desc="TBM은 X로 등록되며 TBM 관리자가 현황에서 변경합니다."
        />
        <Card>
          <VisitForm managers={managers} onSubmit={submit} />
          <Notice ok={msg === '등록되었습니다.'}>{msg}</Notice>
        </Card>
      </>
    );
  const canTbm = ctx.roles.some((r) =>
    ['SUPER_ADMIN', 'TBM_ADMIN'].includes(r),
  );
  return (
    <>
      <Title
        over="VISIT MANAGEMENT"
        title="방문/공사 현황"
        action={
          (ctx.roles.includes('VISITER') || canTbm) && (
            <A className="btn primary" href="/visits/new">
              등록
            </A>
          )
        }
      />
      <Card>
        <div className="filters">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <span>~</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <Btn onClick={load}>조회</Btn>
        </div>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>방문 기간</th>
                <th>업체명</th>
                <th>목적</th>
                <th>인원</th>
                <th>장소</th>
                <th>공사 여부</th>
                <th>TBM</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr
                  key={v.id}
                  className={
                    !v.construction_yn
                      ? 'soft-red'
                      : v.tbm_yn === 'X'
                        ? 'deep-red'
                        : ''
                  }
                >
                  <td>
                    {v.visit_date} ~ {v.visit_end_date}
                  </td>
                  <td>{v.company_name}</td>
                  <td>{v.purpose}</td>
                  <td>{v.visitor_count}</td>
                  <td>{v.construction_location}</td>
                  <td>{v.construction_yn ? 'O' : 'X'}</td>
                  <td>
                    {canTbm ? (
                      <select
                        value={v.tbm_yn}
                        onChange={async (e) => {
                          await supabase
                            .from('visits')
                            .update({
                              tbm_yn: e.target.value,
                              updated_by: ctx.user.id,
                            })
                            .eq('id', v.id);
                          await load();
                        }}
                      >
                        <option>O</option>
                        <option>X</option>
                      </select>
                    ) : (
                      v.tbm_yn
                    )}
                  </td>
                  <td>
                    {canTbm && (
                      <Btn
                        onClick={async () => {
                          if (confirm('삭제하시겠습니까?')) {
                            await supabase
                              .from('visits')
                              .update({
                                deleted_at: new Date().toISOString(),
                                deleted_by: ctx.user.id,
                              })
                              .eq('id', v.id);
                            await load();
                          }
                        }}
                      >
                        삭제
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <p className="empty">조건에 맞는 방문 정보가 없습니다.</p>
        )}
      </Card>
    </>
  );
}
function VisitForm({
  managers,
  onSubmit,
}: {
  managers: any[];
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  const today = seoulDate();
  return (
    <form className="formgrid" onSubmit={onSubmit}>
      <Field label="방문 시작일">
        <input name="start" type="date" defaultValue={today} required />
      </Field>
      <Field label="방문 종료일">
        <input name="end" type="date" defaultValue={today} required />
      </Field>
      <Field label="업체명">
        <input name="company" maxLength={120} required />
      </Field>
      <Field label="방문인원">
        <input
          name="count"
          type="number"
          defaultValue="1"
          min="1"
          max="10000"
          required
        />
      </Field>
      <Field label="목적">
        <textarea name="purpose" required />
      </Field>
      <Field label="공사장소">
        <input name="location" required />
      </Field>
      <Field label="TCK 담당자">
        <select name="manager" required>
          <option value="">선택</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name || m.email}
            </option>
          ))}
        </select>
      </Field>
      <Field label="공사 여부">
        <select name="construction" required>
          <option value="">선택</option>
          <option value="true">O</option>
          <option value="false">X</option>
        </select>
      </Field>
      <Btn type="submit" className="primary full">
        등록하기
      </Btn>
    </form>
  );
}

function Board() {
  const [rows, setRows] = useState<any[]>([]),
    [managers, setManagers] = useState<any[]>([]);
  const load = useCallback(async () => {
    const d = seoulDate();
    const [{ data }, { data: m }] = await Promise.all([
      supabase
        .from('visits')
        .select('*')
        .lte('visit_date', d)
        .gte('visit_end_date', d)
        .is('deleted_at', null),
      supabase.rpc('list_tck_managers'),
    ]);
    setRows(data ?? []);
    setManagers(m ?? []);
  }, []);
  useEffect(() => {
    load();
    const channel = supabase
      .channel('board')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visits' },
        load,
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);
  const map = new Map(managers.map((m) => [m.id, m]));
  return (
    <>
      <Title
        over="LIVE BOARD"
        title="오늘 방문 예정"
        desc={`${seoulDate()} 사업장 방문 및 TBM 현황`}
      />
      <div className="board-summary" aria-label="금일 방문 요약">
        <span>
          업체 <b>{rows.length}</b>곳
        </span>
        <span>
          공사 <b>{rows.filter((v) => v.construction_yn).length}</b>건
        </span>
        <span>
          방문인원 <b>{rows.reduce((s, v) => s + v.visitor_count, 0)}</b>명
        </span>
      </div>
      <Card className="board-table-card">
        <div className="tablewrap board-table-wrap">
          <table className="board-table">
            <thead>
              <tr>
                <th>업체명</th>
                <th>방문/공사 장소</th>
                <th>목적</th>
                <th>TCK 담당자</th>
                <th>방문인원</th>
                <th>공사 여부</th>
                <th>TBM 여부</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr
                  key={v.id}
                  className={
                    !v.construction_yn
                      ? 'soft-red'
                      : v.tbm_yn === 'X'
                        ? 'deep-red'
                        : ''
                  }
                >
                  <td>
                    <b>{v.company_name}</b>
                  </td>
                  <td>{v.construction_location}</td>
                  <td>{v.purpose}</td>
                  <td>
                    {map.get(v.tck_manager_id)?.full_name ||
                      map.get(v.tck_manager_id)?.email ||
                      '—'}
                  </td>
                  <td>{v.visitor_count}명</td>
                  <td>{v.construction_yn ? 'O' : 'X'}</td>
                  <td>
                    <span
                      className={`tbm-status ${v.tbm_yn === 'O' ? 'complete' : 'pending'}`}
                    >
                      {v.tbm_yn}
                    </span>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td className="board-empty" colSpan={7}>
                    금일 방문/공사자 없음
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Posts() {
  const [rows, setRows] = useState<any[]>([]),
    [q, setQ] = useState(''),
    [type, setType] = useState('ALL');
  const load = useCallback(async () => {
    let x = supabase
      .from('posts')
      .select('*,profiles(full_name,email),post_attachments(id)')
      .is('deleted_at', null)
      .neq('post_type', 'SURVEY')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (q)
      x = x.or(
        `title.ilike.%${q.replace(/[%,()]/g, '')}%,content.ilike.%${q.replace(/[%,()]/g, '')}%`,
      );
    if (type !== 'ALL') x = x.eq('post_type', type);
    const { data } = await x;
    setRows(data ?? []);
  }, [q, type]);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <>
      <Title
        over="COMMUNITY"
        title="게시판"
        desc="공지, 자료, 영상과 설문을 확인하세요."
        action={
          <A href="/posts/new" className="btn primary">
            글쓰기
          </A>
        }
      />
      <Card>
        <div className="post-type-legend" aria-label="게시물 유형 안내">
          {[
            ['GENERAL', '일반'],
            ['NOTICE', '공지'],
            ['IMAGE', '이미지'],
            ['VIDEO', '영상'],
          ].map(([value, label]) => (
            <span key={value}>
              <PostTypeIcon type={value} /> {label}
            </span>
          ))}
        </div>
        <div className="filters">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="제목 또는 내용 검색"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label="게시물 유형"
          >
            <option value="ALL">전체 유형</option>
            <option value="GENERAL">일반</option>
            <option value="NOTICE">공지</option>
            <option value="IMAGE">이미지</option>
            <option value="VIDEO">영상</option>
          </select>
          <Btn onClick={load}>검색</Btn>
        </div>
      </Card>
      <Card className="post-table-card">
        <div className="tablewrap post-table-wrap">
          <table className="post-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>구분</th>
                <th>제목</th>
                <th>작성자</th>
                <th>작성일</th>
                <th>조회</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, index) => (
                <tr key={p.id} className={p.is_pinned ? 'pinned-post' : ''}>
                  <td>
                    {p.is_pinned ? (
                      <Pin className="pin-icon" aria-label="상단 고정" />
                    ) : (
                      rows.length - index
                    )}
                  </td>
                  <td>
                    <PostTypeIcon type={p.post_type} />
                  </td>
                  <td className="post-title-cell">
                    <A href={`/posts/${p.id}`} className="post-title-link">
                      {p.title}
                    </A>
                    {p.post_attachments?.length > 0 && (
                      <Paperclip
                        className="attachment-icon"
                        aria-label="첨부파일 있음"
                      />
                    )}
                  </td>
                  <td>{p.profiles?.full_name || p.profiles?.email}</td>
                  <td>{fmtDate(p.created_at)}</td>
                  <td>{p.view_count}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6} className="post-empty">
                    등록된 게시물이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
function PostTypeIcon({ type }: { type: string }) {
  const className = `post-type-icon type-${type.toLowerCase()}`;
  if (type === 'NOTICE')
    return <Megaphone className={className} aria-label="공지" />;
  if (type === 'SURVEY')
    return <BarChart3 className={className} aria-label="설문" />;
  if (type === 'IMAGE')
    return <ImageIcon className={className} aria-label="이미지" />;
  if (type === 'VIDEO')
    return <PlaySquare className={className} aria-label="영상" />;
  return <BookOpen className={className} aria-label="일반" />;
}
function NewPost({ surveyMode = false }: { surveyMode?: boolean }) {
  const [type, setType] = useState(surveyMode ? 'SURVEY' : 'GENERAL'),
    [msg, setMsg] = useState('');
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      {
        data: { user },
      } = await supabase.auth.getUser();
    if (!user) return;
    const title = String(f.get('title')).trim(),
      content = String(f.get('content')).trim();
    if (!title || !content || !type) {
      setMsg('제목, 내용, 유형을 확인하세요.');
      return;
    }
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        title,
        content,
        post_type: type,
        author_id: user.id,
        is_pinned: f.get('pinned') === 'on',
        external_video_url: f.get('video') || null,
        download_allowed:
          type !== 'VIDEO' || f.get('download_allowed') === 'on',
      })
      .select('id')
      .single();
    if (error || !post) {
      setMsg(error?.message || '저장하지 못했습니다.');
      return;
    }
    const file = f.get('file') as File;
    if (file?.size) {
      if (file.size > 104857600) {
        setMsg('파일은 100MB 이하여야 합니다.');
        return;
      }
      const ext = file.name.split('.').pop(),
        path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage
        .from('post-attachments')
        .upload(path, file);
      if (up.error) {
        setMsg(up.error.message);
        return;
      }
      await supabase.from('post_attachments').insert({
        post_id: post.id,
        file_name: file.name,
        file_path: path,
        file_type: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO',
        file_size: file.size,
        mime_type: file.type,
      });
    }
    if (type === 'SURVEY') {
      const starts = new Date(String(f.get('starts'))),
        ends = new Date(String(f.get('ends'))),
        options = String(f.get('options'))
          .split('\n')
          .map((x) => x.trim())
          .filter(Boolean);
      if (starts >= ends || options.length < 2) {
        setMsg('설문 기간과 선택지 두 개 이상을 확인하세요.');
        return;
      }
      const { data: s } = await supabase
        .from('surveys')
        .insert({
          post_id: post.id,
          starts_at: starts.toISOString(),
          ends_at: ends.toISOString(),
          is_results_public: false,
        })
        .select('id')
        .single();
      if (!s) {
        setMsg('설문을 저장하지 못했습니다.');
        return;
      }
      const { data: qu } = await supabase
        .from('survey_questions')
        .insert({
          survey_id: s.id,
          question_text: f.get('question'),
          allow_multiple: f.get('multiple') === 'on',
        })
        .select('id')
        .single();
      if (!qu) {
        setMsg('설문 질문을 저장하지 못했습니다.');
        return;
      }
      await supabase.from('survey_options').insert(
        options.map((o, i) => ({
          question_id: qu.id,
          option_text: o,
          sort_order: i,
        })),
      );
    }
    window.alert('등록되었습니다.');
    go(surveyMode ? '/surveys' : '/posts');
  };
  return (
    <>
      <Title
        over={surveyMode ? 'NEW SURVEY' : 'NEW POST'}
        title={surveyMode ? '설문 작성' : '게시글 작성'}
      />
      <Card>
        <form onSubmit={submit}>
          {!surveyMode && (
            <>
              <Field label="유형">
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="GENERAL">일반</option>
                  <option value="NOTICE">공지</option>
                  <option value="IMAGE">이미지</option>
                  <option value="VIDEO">영상</option>
                </select>
              </Field>
              <label className="check">
                <input name="pinned" type="checkbox" /> 게시판 최상단에 고정
              </label>
            </>
          )}
          <Field label="제목">
            <input name="title" required />
          </Field>
          <Field label="내용">
            <textarea name="content" rows={9} required />
          </Field>
          {type === 'VIDEO' && (
            <>
              <Field label="외부 영상 URL">
                <input name="video" type="url" />
              </Field>
              <label className="check">
                <input name="download_allowed" type="checkbox" /> 영상 다운로드
                허용
              </label>
            </>
          )}
          {['IMAGE', 'VIDEO'].includes(type) && (
            <Field label="첨부파일 (최대 100MB)">
              <input
                name="file"
                type="file"
                accept={type === 'IMAGE' ? 'image/*' : 'video/*'}
              />
            </Field>
          )}
          {type === 'SURVEY' && (
            <fieldset>
              <legend>설문 설정</legend>
              <Field label="질문">
                <input name="question" required />
              </Field>
              <div className="formgrid">
                <Field label="시작">
                  <input name="starts" type="datetime-local" required />
                </Field>
                <Field label="종료">
                  <input name="ends" type="datetime-local" required />
                </Field>
              </div>
              <Field label="선택지 (한 줄에 하나)">
                <textarea name="options" rows={5} required />
              </Field>
              <label className="check">
                <input name="multiple" type="checkbox" /> 복수 선택 허용
              </label>
            </fieldset>
          )}
          <Notice>{msg}</Notice>
          <Btn type="submit" className="primary">
            {surveyMode ? '설문 등록' : '게시글 등록'}
          </Btn>
        </form>
      </Card>
    </>
  );
}
function Surveys({ ctx }: { ctx: Context }) {
  const [rows, setRows] = useState<any[]>([]);
  const canCreate = ctx.roles.some((role) =>
    ['SUPER_ADMIN', 'TBM_ADMIN', 'VIEWER', 'VISITER'].includes(role),
  );
  const load = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select(
        'id,title,content,author_id,created_at,profiles(full_name,email),surveys(id,starts_at,ends_at,survey_questions(id,question_text,allow_multiple,survey_options(id,option_text,sort_order)))',
      )
      .eq('post_type', 'SURVEY')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    setRows(data ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <>
      <Title
        over="SURVEY"
        title="설문"
        desc="설문 내용을 확인하고 이 화면에서 바로 응답할 수 있습니다."
        action={
          canCreate && (
            <A href="/surveys/new" className="btn primary">
              설문 작성
            </A>
          )
        }
      />
      <div className="survey-list">
        {rows.map((post) => (
          <SurveyItem key={post.id} ctx={ctx} post={post} />
        ))}
        {!rows.length && <Card>등록된 설문이 없습니다.</Card>}
      </div>
    </>
  );
}
function SurveyItem({ ctx, post }: { ctx: Context; post: any }) {
  const survey = Array.isArray(post.surveys) ? post.surveys[0] : post.surveys;
  const question = survey?.survey_questions?.[0];
  const [responses, setResponses] = useState<any[]>([]),
    [msg, setMsg] = useState('');
  const privileged = ctx.roles.some((role) =>
    ['SUPER_ADMIN', 'TBM_ADMIN'].includes(role),
  );
  const loadResponses = useCallback(async () => {
    if (!survey?.id) return;
    const { data } = await supabase
      .from('survey_responses')
      .select(
        'id,user_id,created_at,profiles(full_name,email),survey_answers(option_id,survey_options(option_text))',
      )
      .eq('survey_id', survey.id)
      .order('created_at', { ascending: false });
    setResponses(data ?? []);
  }, [survey?.id]);
  useEffect(() => {
    loadResponses();
  }, [loadResponses]);
  if (!survey || !question) return null;
  const now = Date.now();
  const started =
    !survey.starts_at || now >= new Date(survey.starts_at).getTime();
  const ended = !!survey.ends_at && now >= new Date(survey.ends_at).getTime();
  const ownResponse = responses.find((r) => r.user_id === ctx.user.id);
  const answerText = (response: any) =>
    response.survey_answers
      ?.map((answer: any) => answer.survey_options?.option_text)
      .filter(Boolean)
      .join(', ') || '답변 없음';
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const opts = new FormData(e.currentTarget).getAll('option');
    if (!opts.length) return setMsg('답변을 선택하세요.');
    const { data: response, error } = await supabase
      .from('survey_responses')
      .insert({ survey_id: survey.id, user_id: ctx.user.id })
      .select('id')
      .single();
    if (error || !response) {
      setMsg('이미 응답했거나 현재 참여할 수 없습니다.');
      return;
    }
    const { error: answerError } = await supabase.from('survey_answers').insert(
      opts.map((option) => ({
        response_id: response.id,
        question_id: question.id,
        option_id: option,
      })),
    );
    if (answerError) return setMsg('답변을 저장하지 못했습니다.');
    setMsg('응답이 제출되었습니다.');
    await loadResponses();
  };
  return (
    <Card className="survey-card">
      <div className="survey-head">
        <div>
          <span
            className={`survey-state ${ended ? 'ended' : started ? 'active' : 'waiting'}`}
          >
            {ended ? '종료' : started ? '진행 중' : '예정'}
          </span>
          <h2>{post.title}</h2>
          <small>
            {post.profiles?.full_name || post.profiles?.email} ·{' '}
            {survey.starts_at ? fmt(survey.starts_at) : '즉시 시작'} ~{' '}
            {survey.ends_at ? fmt(survey.ends_at) : '종료일 없음'}
          </small>
        </div>
      </div>
      <p className="content survey-content">{post.content}</p>
      <h3>{question.question_text}</h3>
      {!ownResponse && started && !ended ? (
        <form onSubmit={submit}>
          {question.survey_options
            ?.sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((option: any) => (
              <label className="choice" key={option.id}>
                <input
                  type={question.allow_multiple ? 'checkbox' : 'radio'}
                  name="option"
                  value={option.id}
                  required={!question.allow_multiple}
                />
                {option.option_text}
              </label>
            ))}
          <Notice ok={msg.includes('제출')}>{msg}</Notice>
          <Btn type="submit" className="primary">
            응답 제출
          </Btn>
        </form>
      ) : ownResponse ? (
        <div className="own-answer">
          <b>내 답변</b>
          <span>{answerText(ownResponse)}</span>
        </div>
      ) : (
        <p className="muted">현재 응답할 수 없는 설문입니다.</p>
      )}
      {privileged && (
        <div className="survey-results">
          <h3>전체 참여자 답변 ({responses.length}명)</h3>
          <div className="tablewrap survey-result-table">
            <table>
              <thead>
                <tr>
                  <th>참여자</th>
                  <th>답변</th>
                  <th>응답일시</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((response) => (
                  <tr key={response.id}>
                    <td>
                      {response.profiles?.full_name ||
                        response.profiles?.email ||
                        response.user_id}
                    </td>
                    <td>{answerText(response)}</td>
                    <td>{fmt(response.created_at)}</td>
                  </tr>
                ))}
                {!responses.length && (
                  <tr>
                    <td colSpan={3}>아직 응답이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}
function PostDetail({ ctx, id }: { ctx: Context; id: string }) {
  const [post, setPost] = useState<any>(),
    [survey, setSurvey] = useState<any>(),
    [msg, setMsg] = useState('');
  const load = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('*,profiles(full_name,email),post_attachments(*)')
      .eq('id', id)
      .single();
    setPost(data);
    void supabase.rpc('increment_post_view', { post_id: id });
    if (data?.post_type === 'SURVEY') {
      const { data: s } = await supabase
        .from('surveys')
        .select('*,survey_questions(*,survey_options(*))')
        .eq('post_id', id)
        .single();
      setSurvey(s);
    }
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);
  if (!post) return <p>불러오는 중...</p>;
  const canEdit =
    post.post_type !== 'SURVEY' &&
    (ctx.roles.includes('SUPER_ADMIN') || post.author_id === ctx.user.id);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const opts = new FormData(e.currentTarget).getAll('option'),
      q = survey.survey_questions[0];
    const { data: r, error } = await supabase
      .from('survey_responses')
      .insert({ survey_id: survey.id, user_id: ctx.user.id })
      .select('id')
      .single();
    if (error) {
      setMsg('이미 응답했거나 제출할 수 없습니다.');
      return;
    }
    await supabase.from('survey_answers').insert(
      opts.map((o) => ({
        response_id: r.id,
        question_id: q.id,
        option_id: o,
      })),
    );
    setMsg('응답이 제출되었습니다.');
  };
  return (
    <>
      <Title
        over={post.post_type}
        title={post.title}
        desc={`${post.profiles?.full_name || post.profiles?.email} · ${fmt(post.created_at)}`}
        action={
          <div className="title-actions">
            <A href="/posts" className="btn">
              목록
            </A>
            {canEdit && (
              <A href={`/posts/${id}/edit`} className="btn primary">
                수정
              </A>
            )}
          </div>
        }
      />
      <Card>
        <p className="content">{post.content}</p>
        {post.external_video_url && (
          <a href={post.external_video_url} target="_blank">
            외부 영상 보기
          </a>
        )}
        <Attachments
          rows={post.post_attachments}
          downloadAllowed={post.download_allowed !== false}
        />
      </Card>
      {survey && (
        <Card>
          <h2>{survey.survey_questions[0]?.question_text}</h2>
          <p>
            {fmt(survey.starts_at)} ~ {fmt(survey.ends_at)}
          </p>
          <form onSubmit={submit}>
            {survey.survey_questions[0]?.survey_options.map((o: any) => (
              <label className="choice" key={o.id}>
                <input
                  type={
                    survey.survey_questions[0].allow_multiple
                      ? 'checkbox'
                      : 'radio'
                  }
                  name="option"
                  value={o.id}
                  required={!survey.survey_questions[0].allow_multiple}
                />
                {o.option_text}
              </label>
            ))}
            <Notice ok={msg.includes('제출')}>{msg}</Notice>
            <Btn type="submit" className="primary">
              응답 제출
            </Btn>
          </form>
        </Card>
      )}
      {ctx.roles.includes('SUPER_ADMIN') && post.post_type !== 'SURVEY' && (
        <Btn
          onClick={async () => {
            if (confirm('삭제하시겠습니까?')) {
              await supabase
                .from('posts')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);
              go('/posts');
            }
          }}
        >
          삭제
        </Btn>
      )}
    </>
  );
}
function EditPost({ ctx, id }: { ctx: Context; id: string }) {
  const [post, setPost] = useState<any>(),
    [msg, setMsg] = useState('');
  useEffect(() => {
    supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => setPost(data));
  }, [id]);
  if (!post) return <p>불러오는 중...</p>;
  const canEdit =
    post.post_type !== 'SURVEY' &&
    (ctx.roles.includes('SUPER_ADMIN') || post.author_id === ctx.user.id);
  if (!canEdit)
    return <Card>설문 또는 수정 권한이 없는 게시물은 수정할 수 없습니다.</Card>;
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const title = String(f.get('title')).trim();
    const content = String(f.get('content')).trim();
    if (!title || !content) return setMsg('제목과 내용을 입력하세요.');
    const { error } = await supabase
      .from('posts')
      .update({
        title,
        content,
        is_pinned: f.get('pinned') === 'on',
        external_video_url:
          post.post_type === 'VIDEO' ? f.get('video') || null : null,
        download_allowed:
          post.post_type !== 'VIDEO' || f.get('download_allowed') === 'on',
      })
      .eq('id', id);
    if (error) return setMsg(error.message);
    window.alert('수정되었습니다.');
    go(`/posts/${id}`);
  };
  return (
    <>
      <Title over="EDIT POST" title="게시글 수정" />
      <Card>
        <form onSubmit={submit}>
          <Field label="유형">
            <input value={post.post_type} disabled />
          </Field>
          <label className="check">
            <input
              name="pinned"
              type="checkbox"
              defaultChecked={post.is_pinned}
            />
            게시판 최상단에 고정
          </label>
          <Field label="제목">
            <input name="title" defaultValue={post.title} required />
          </Field>
          <Field label="내용">
            <textarea
              name="content"
              rows={9}
              defaultValue={post.content}
              required
            />
          </Field>
          {post.post_type === 'VIDEO' && (
            <>
              <Field label="외부 영상 URL">
                <input
                  name="video"
                  type="url"
                  defaultValue={post.external_video_url || ''}
                />
              </Field>
              <label className="check">
                <input
                  name="download_allowed"
                  type="checkbox"
                  defaultChecked={post.download_allowed !== false}
                />
                영상 다운로드 허용
              </label>
            </>
          )}
          <Notice>{msg}</Notice>
          <Btn type="submit" className="primary">
            수정 완료
          </Btn>
        </form>
      </Card>
    </>
  );
}
function Attachments({
  rows = [],
  downloadAllowed = true,
}: {
  rows: any[];
  downloadAllowed?: boolean;
}) {
  const [urls, setUrls] = useState<any[]>([]);
  useEffect(() => {
    Promise.all(
      rows.map(async (a) => ({
        ...a,
        url: (
          await supabase.storage
            .from('post-attachments')
            .createSignedUrl(a.file_path, 3600)
        ).data?.signedUrl,
      })),
    ).then(setUrls);
  }, [rows]);
  return (
    <>
      {urls.map((a) => (
        <figure key={a.id}>
          {a.file_type === 'IMAGE' ? (
            <img src={a.url} alt={a.file_name} />
          ) : (
            <video
              src={a.url}
              controls
              controlsList={downloadAllowed ? undefined : 'nodownload'}
              onContextMenu={
                downloadAllowed ? undefined : (e) => e.preventDefault()
              }
            />
          )}
          {(a.file_type === 'IMAGE' || downloadAllowed) && (
            <a href={a.url} download>
              {a.file_name} 다운로드
            </a>
          )}
        </figure>
      ))}
    </>
  );
}

function UsersAdmin({ ctx }: { ctx: Context }) {
  const [rows, setRows] = useState<any[]>([]),
    [msg, setMsg] = useState('');
  const load = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*,user_roles(roles(name))')
      .order('created_at', { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => {
    load();
  }, []);
  const op = async (id: string, operation: string, value?: string) => {
    const { error } = await supabase.rpc('manage_user', {
      target_user: id,
      operation,
      requested_value: value ?? null,
    });
    setMsg(error?.message ?? '처리되었습니다.');
    await load();
  };
  const superUser = ctx.roles.includes('SUPER_ADMIN');
  return (
    <>
      <Title
        over="ACCESS APPROVAL"
        title="사용자 관리"
        desc={`${rows.length}개의 사용자 계정`}
      />
      <Notice ok={msg === '처리되었습니다.'}>{msg}</Notice>
      <Card>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>사용자명</th>
                <th>이메일</th>
                <th>역할</th>
                <th>상태</th>
                <th>마지막 로그인</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const role = u.user_roles?.[0]?.roles?.name ?? 'VISITER';
                return (
                  <tr key={u.id}>
                    <td>{u.full_name || '이름 없음'}</td>
                    <td>{u.email}</td>
                    <td>
                      <select
                        value={role}
                        disabled={
                          !superUser && !['VIEWER', 'VISITER'].includes(role)
                        }
                        onChange={(e) => op(u.id, 'ROLE', e.target.value)}
                      >
                        {[
                          'VISITER',
                          'VIEWER',
                          ...(superUser
                            ? [
                                'TBM_ADMIN',
                                'APPR_ADMIN',
                                'AUDIT_ADMIN',
                                'SUPER_ADMIN',
                              ]
                            : []),
                        ].map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td>{u.status}</td>
                    <td>{u.last_sign_in_at ? fmt(u.last_sign_in_at) : '—'}</td>
                    <td>
                      {u.status === 'PENDING' && (
                        <Btn onClick={() => op(u.id, 'APPROVE')}>가입 승인</Btn>
                      )}
                      {superUser && u.status !== 'PENDING' && (
                        <Btn
                          onClick={() =>
                            op(
                              u.id,
                              'STATUS',
                              u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                            )
                          }
                        >
                          {u.status === 'ACTIVE' ? '비활성화' : '활성화'}
                        </Btn>
                      )}
                      {superUser && u.id !== ctx.user.id && (
                        <Btn
                          onClick={() =>
                            confirm('계정을 삭제하시겠습니까?') &&
                            op(u.id, 'DELETE')
                          }
                        >
                          삭제
                        </Btn>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
function Logs() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase
      .from('audit_logs')
      .select('*,profiles(email)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => setRows(data ?? []));
  }, []);
  return (
    <>
      <Title
        over="SECURITY"
        title="시스템 로그"
        desc="로그인 및 중요한 관리자 작업을 추적합니다."
      />
      <Card>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>작업</th>
                <th>수행자</th>
                <th>대상</th>
                <th>설명</th>
                <th>시간</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x) => (
                <tr key={x.id}>
                  <td>{x.action}</td>
                  <td>{x.profiles?.email || '시스템'}</td>
                  <td>{x.target_type || '—'}</td>
                  <td>{x.description || '—'}</td>
                  <td>{fmt(x.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
function ServiceSettings({ ctx }: { ctx: Context }) {
  const [msg, setMsg] = useState('');
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      rows = [
        {
          key: 'site_title',
          value: JSON.stringify(f.get('title')),
          is_public: true,
          updated_by: ctx.user.id,
        },
        {
          key: 'maintenance_mode',
          value: JSON.stringify(f.get('maintenance') === 'on'),
          is_public: true,
          updated_by: ctx.user.id,
        },
        {
          key: 'session_timeout_minutes',
          value: JSON.stringify(
            Math.max(1, Math.min(1440, Number(f.get('timeout')))),
          ),
          is_public: true,
          updated_by: ctx.user.id,
        },
      ];
    const { error } = await supabase
      .from('system_settings')
      .upsert(rows, { onConflict: 'key' });
    setMsg(
      error?.message ?? '저장되었습니다. 새로고침 후 전체 화면에 반영됩니다.',
    );
  };
  return (
    <>
      <Title over="SYSTEM" title="서비스 설정" />
      <Card>
        <form onSubmit={submit}>
          <Field label="서비스 이름">
            <input name="title" defaultValue={ctx.siteTitle} />
          </Field>
          <Field label="로그인 유지시간(분)">
            <input
              name="timeout"
              type="number"
              min="1"
              max="1440"
              defaultValue={ctx.timeout}
            />
          </Field>
          <label className="check">
            <input name="maintenance" type="checkbox" /> 유지보수 모드
            (SUPER_ADMIN 외 사용자 접속 제한)
          </label>
          <Notice ok={msg.startsWith('저장')}>{msg}</Notice>
          <Btn type="submit" className="primary">
            저장
          </Btn>
        </form>
      </Card>
    </>
  );
}
function MySettings() {
  const [msg, setMsg] = useState('');
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      p = String(f.get('password'));
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(p)) {
      setMsg(
        '8자 이상이며 영문 대·소문자, 숫자, 특수문자를 각각 포함해야 합니다.',
      );
      return;
    }
    if (p !== f.get('confirm')) {
      setMsg('비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: p });
    setMsg(error?.message ?? '비밀번호가 변경되었습니다.');
  };
  return (
    <>
      <Title over="ACCOUNT" title="내 설정" />
      <Card>
        <h2>비밀번호 변경</h2>
        <form onSubmit={submit}>
          <Field label="새 비밀번호">
            <input name="password" type="password" required />
          </Field>
          <Field label="비밀번호 확인">
            <input name="confirm" type="password" required />
          </Field>
          <small>8자 이상 · 영문 대문자/소문자 · 숫자 · 특수문자 포함</small>
          <Notice ok={msg.includes('변경')}>{msg}</Notice>
          <Btn type="submit" className="primary">
            암호 변경
          </Btn>
        </form>
      </Card>
    </>
  );
}
function Roles() {
  return (
    <>
      <Title over="RBAC" title="권한 관리" />
      <div className="list">
        {Object.entries({
          SUPER_ADMIN: '모든 기능',
          AUDIT_ADMIN: '감사 로그 조회',
          APPR_ADMIN: '가입 승인 및 VIEWER/VISITER 변경',
          TBM_ADMIN: '방문·공사 및 TBM 관리',
          VIEWER: '등록 데이터 조회',
          VISITER: '외부업체 방문·공사 등록',
        }).map(([r, d]) => (
          <Card key={r}>
            <h3>{r}</h3>
            <p>{d}</p>
          </Card>
        ))}
      </div>
    </>
  );
}

function Protected({ path }: { path: string }) {
  const [ctx, setCtx] = useState<Context | null>(null),
    [error, setError] = useState('');
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        location.href = '/login';
        return;
      }
      const { data, error } = await supabase.rpc('current_user_context');
      if (error || !data) {
        setError('사용자 정보를 불러오지 못했습니다.');
        return;
      }
      if (data.status !== 'ACTIVE') {
        await supabase.auth.signOut();
        location.href = '/login';
        return;
      }
      const roles = (data.roles ?? []) as Role[];
      if (data.maintenance_mode && !roles.includes('SUPER_ADMIN')) {
        setError('현재 유지보수 중입니다.');
        return;
      }
      setCtx({
        user,
        profile: data,
        roles,
        siteTitle: data.site_title || 'TCK Safety',
        timeout: Number(data.session_timeout_minutes) || 10,
      });
    })();
  }, []);
  if (error)
    return (
      <main className="auth">
        <Card>
          <h1>{error}</h1>
        </Card>
      </main>
    );
  if (!ctx) return <div className="loading">안전하게 연결하는 중...</div>;
  const base = path.startsWith('/posts/') ? '/posts' : path;
  const req = allowed[path] ?? allowed[base] ?? [];
  if (req.length && !req.some((r) => ctx.roles.includes(r)))
    return (
      <Shell ctx={ctx}>
        <Card>
          <h1>접근 권한이 없습니다.</h1>
        </Card>
      </Shell>
    );
  let page: React.ReactNode;
  if (path === '/dashboard') page = <Dashboard ctx={ctx} />;
  else if (path === '/visits/new') page = <Visits ctx={ctx} newMode />;
  else if (path === '/visits') page = <Visits ctx={ctx} />;
  else if (path === '/board') page = <Board />;
  else if (path === '/surveys/new') page = <NewPost surveyMode />;
  else if (path === '/surveys') page = <Surveys ctx={ctx} />;
  else if (path === '/posts/new') page = <NewPost />;
  else if (/^\/posts\/[^/]+\/edit$/.test(path))
    page = <EditPost ctx={ctx} id={path.split('/')[2]} />;
  else if (path.startsWith('/posts/'))
    page = <PostDetail ctx={ctx} id={path.split('/')[2]} />;
  else if (path === '/posts') page = <Posts />;
  else if (path === '/admin/users') page = <UsersAdmin ctx={ctx} />;
  else if (path === '/admin/logs') page = <Logs />;
  else if (path === '/admin/settings') page = <ServiceSettings ctx={ctx} />;
  else if (path === '/admin/roles') page = <Roles />;
  else if (path === '/settings') page = <MySettings />;
  else page = <Dashboard ctx={ctx} />;
  return <Shell ctx={ctx}>{page}</Shell>;
}
function App() {
  const [path, setPath] = useState(location.pathname.replace(/\/$/, '') || '/');
  useEffect(() => {
    const h = () => setPath(location.pathname.replace(/\/$/, '') || '/');
    addEventListener('popstate', h);
    return () => removeEventListener('popstate', h);
  }, []);
  if (path === '/') return <PublicHome />;
  if (path === '/login') return <AuthPage />;
  if (path === '/signup') return <AuthPage signup />;
  return <Protected path={path} />;
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
