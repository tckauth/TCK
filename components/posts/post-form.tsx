'use client';
import { useActionState, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { createPost } from '@/app/posts/actions';
export function PostForm() {
  const [state, action, pending] = useActionState(createPost, {
    ok: false,
    message: '',
  });
  const [type, setType] = useState('GENERAL');
  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="postType">게시글 유형</Label>
        <NativeSelect
          id="postType"
          name="postType"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full"
        >
          <NativeSelectOption value="GENERAL">일반</NativeSelectOption>
          <NativeSelectOption value="NOTICE">공지</NativeSelectOption>
          <NativeSelectOption value="IMAGE">이미지</NativeSelectOption>
          <NativeSelectOption value="VIDEO">영상</NativeSelectOption>
          <NativeSelectOption value="SURVEY">설문</NativeSelectOption>
        </NativeSelect>
      </div>
      <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
        <input type="checkbox" name="isPinned" />
        게시판 최상단에 고정
      </label>
      <div className="space-y-2">
        <Label htmlFor="title">제목</Label>
        <Input id="title" name="title" required maxLength={200} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">내용</Label>
        <Textarea
          id="content"
          name="content"
          required
          maxLength={20000}
          rows={10}
        />
      </div>
      {type === 'VIDEO' && (
        <div className="space-y-2">
          <Label htmlFor="externalVideoUrl">외부 영상 URL (선택)</Label>
          <Input
            id="externalVideoUrl"
            name="externalVideoUrl"
            type="url"
            placeholder="https://..."
          />
        </div>
      )}
      {['IMAGE', 'VIDEO'].includes(type) && (
        <div className="space-y-2">
          <Label htmlFor="attachment">첨부파일 (최대 100MB)</Label>
          <Input
            id="attachment"
            name="attachment"
            type="file"
            accept={
              type === 'IMAGE'
                ? 'image/jpeg,image/png,image/gif,image/webp'
                : 'video/mp4,video/webm,video/quicktime'
            }
          />
        </div>
      )}
      {type === 'SURVEY' && (
        <fieldset className="space-y-4 rounded-xl border p-4">
          <legend className="px-2 font-medium">설문 설정</legend>
          <div className="space-y-2">
            <Label htmlFor="surveyQuestion">질문</Label>
            <Input id="surveyQuestion" name="surveyQuestion" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="surveyStartsAt">설문 시작</Label>
              <Input id="surveyStartsAt" name="surveyStartsAt" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surveyEndsAt">설문 종료</Label>
              <Input id="surveyEndsAt" name="surveyEndsAt" type="datetime-local" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="surveyOptions">선택지 (한 줄에 하나)</Label>
            <Textarea
              id="surveyOptions"
              name="surveyOptions"
              required
              rows={6}
              placeholder={'매우 그렇다\n그렇다\n보통\n아니다\n전혀 아니다'}
            />
          </div>
          <label className="flex gap-2 text-sm">
            <input type="checkbox" name="allowMultiple" />
            복수 선택 허용
          </label>
          <label className="flex gap-2 text-sm">
            <input type="checkbox" name="resultsPublic" />
            일반 사용자에게 결과 공개
          </label>
        </fieldset>
      )}
      {state.message && (
        <output className="block rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </output>
      )}
      <Button size="lg" disabled={pending}>
        {pending && <LoaderCircle className="animate-spin" />}게시글 등록
      </Button>
    </form>
  );
}
