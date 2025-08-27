// Chốt trạng thái theo hành động của người dùng (manual only) + persist
// Đảm bảo trạng thái hoạt động của kỹ thuật viên ổn định khi vào ca.

// src/hooks/useLocalStorageState.ts
'use client';
import { useEffect, useState } from 'react';

export function useLocalStorageState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);

  return [state, setState] as const;
}
