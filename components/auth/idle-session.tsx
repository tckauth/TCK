'use client';

import { useEffect } from 'react';
import { logout } from '@/app/(auth)/actions';

export function IdleSession({ minutes }: { minutes: number }) {
  useEffect(() => {
    const timeout = Math.max(1, minutes) * 60_000;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void logout(), timeout);
    };
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach((event) => window.addEventListener(event, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, reset));
    };
  }, [minutes]);
  return null;
}
