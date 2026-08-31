'use client';
import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deletePost } from '@/app/posts/actions';
export function DeletePostButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="destructive"
      disabled={pending}
      onClick={() => {
        if (window.confirm('게시글을 삭제하시겠습니까?'))
          start(() => deletePost(id));
      }}
    >
      <Trash2 />
      삭제
    </Button>
  );
}
