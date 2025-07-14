// components/ui/badge.tsx
import React from 'react';
import clsx from 'clsx';

type BadgeVariant = 'default' | 'success' | 'destructive' | 'warning';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-200 text-gray-800',
  success: 'bg-green-100 text-green-800',
  destructive: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
};

export function Badge({ children, className = '', variant = 'default' }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-block rounded-full px-2 py-1 text-xs font-semibold',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
