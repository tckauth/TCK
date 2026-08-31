'use client';
import { useState, useTransition } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { changeTbm } from '@/app/visits/actions';
export function TbmControl({
  id,
  value,
}: {
  id: string;
  value: 'O' | 'X' | null;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState('');
  const change = (next: 'O' | 'X') =>
    start(async () => {
      try {
        await changeTbm(id, next);
        setMessage('TBM 상태가 변경되었습니다.');
      } catch {
        setMessage('변경하지 못했습니다.');
      }
    });
  return (
    <div>
      <div className="flex gap-1">
        <Button
          type="button"
          size="sm"
          variant={value === 'O' ? 'default' : 'outline'}
          disabled={pending}
          onClick={() => change('O')}
          aria-label="TBM O로 변경"
        >
          <Check />O
        </Button>
        <Button
          type="button"
          size="sm"
          variant={value === 'X' ? 'destructive' : 'outline'}
          disabled={pending}
          onClick={() => change('X')}
          aria-label="TBM X로 변경"
        >
          <X />X
        </Button>
      </div>
      {message && (
        <span className="sr-only" aria-live="polite">
          {message}
        </span>
      )}
    </div>
  );
}
