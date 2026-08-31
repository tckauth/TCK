'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteVisit } from '@/app/visits/actions';
export function DeleteVisitButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button
      variant="destructive"
      disabled={pending}
      onClick={() => {
        if (
          window.confirm(
            '정말 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.',
          )
        )
          start(async () => {
            await deleteVisit(id);
            router.push('/visits');
          });
      }}
    >
      <Trash2 />
      삭제
    </Button>
  );
}
