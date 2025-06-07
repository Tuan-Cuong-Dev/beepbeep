// src/lib/utils/cn.ts

export function cn(...inputs: (string | undefined | false)[]) {
    return inputs.filter(Boolean).join(' ');
  }
  