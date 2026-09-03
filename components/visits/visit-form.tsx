'use client';
import { useActionState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import type { VisitResult } from '@/app/visits/actions';
type Manager = { id: string; full_name: string | null; email: string };
export function VisitForm({
  action,
  managers,
  initial,
}: {
  action: (s: VisitResult, d: FormData) => Promise<VisitResult>;
  managers: Manager[];
  initial?: Record<string, string | number | boolean | null>;
}) {
  const [state, formAction, pending] = useActionState(action, {
    ok: false,
    message: '',
  });
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return (
    <form action={formAction} className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="visitStartDate">방문 시작일</Label>
        <Input
          id="visitStartDate"
          name="visitStartDate"
          type="date"
          required
          defaultValue={String(initial?.visit_date ?? today)}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="visitEndDate">방문 종료일</Label>
        <Input
          id="visitEndDate"
          name="visitEndDate"
          type="date"
          required
          defaultValue={String(initial?.visit_end_date ?? initial?.visit_date ?? today)}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="companyName">업체명</Label>
        <Input
          id="companyName"
          name="companyName"
          required
          maxLength={120}
          defaultValue={String(initial?.company_name ?? '')}
          className="h-11"
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="purpose">방문/공사 목적</Label>
        <Textarea
          id="purpose"
          name="purpose"
          required
          maxLength={1000}
          rows={4}
          defaultValue={String(initial?.purpose ?? '')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="visitorCount">방문인원</Label>
        <div className="flex items-center gap-2">
          <Input
            id="visitorCount"
            name="visitorCount"
            type="number"
            min={1}
            max={10000}
            required
            defaultValue={Number(initial?.visitor_count ?? 1)}
            className="h-11"
          />
          <span className="text-sm text-muted-foreground">명</span>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="constructionLocation">공사/방문 장소</Label>
        <Input
          id="constructionLocation"
          name="constructionLocation"
          required
          maxLength={200}
          defaultValue={String(initial?.construction_location ?? '')}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tckManagerId">TCK 담당자</Label>
        <NativeSelect
          id="tckManagerId"
          name="tckManagerId"
          required
          defaultValue={String(initial?.tck_manager_id ?? '')}
          className="w-full [&>select]:h-11"
        >
          <NativeSelectOption value="">담당자 선택</NativeSelectOption>
          {managers.map((m) => (
            <NativeSelectOption key={m.id} value={m.id}>
              {m.full_name ?? m.email}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">공사 여부</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border has-[:checked]:border-primary has-[:checked]:bg-primary/10">
            <input
              type="radio"
              name="constructionYn"
              value="true"
              required
              defaultChecked={initial?.construction_yn === true}
            />{' '}
            O
          </label>
          <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border has-[:checked]:border-primary has-[:checked]:bg-primary/10">
            <input
              type="radio"
              name="constructionYn"
              value="false"
              required
              defaultChecked={initial?.construction_yn === false}
            />{' '}
            X
          </label>
        </div>
      </fieldset>
      {state.message && (
        <output
          className={`sm:col-span-2 rounded-lg p-3 text-sm ${state.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}
        >
          {state.message}
        </output>
      )}
      <Button type="submit" size="lg" className="h-12 sm:col-span-2" disabled={pending}>
        {pending && <LoaderCircle className="animate-spin" />}
        {initial ? '수정 저장' : '등록하기'}
      </Button>
    </form>
  );
}
