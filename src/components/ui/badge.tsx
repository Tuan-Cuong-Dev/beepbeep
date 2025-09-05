/**
 * Badge component (rounded label), used in tables, status indicators, etc.
 *
 * ✅ Compatible with Next.js / CRA (no need for special module config)
 */

import * as React from 'react'
import clsx from 'clsx'

/** Variants (extendable if needed) */
type BadgeVariant =
  | 'default'
  | 'success'
  | 'destructive'
  | 'warning'
  | 'secondary'
  | 'brand'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  className?: string
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-200 text-gray-800',
  success: 'bg-green-100 text-green-800',
  destructive: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  secondary: 'bg-gray-100 text-gray-600',
  brand: 'bg-[#00d289] text-white', // ✅ màu thương hiệu Bíp Bíp
}

export function Badge({ children, className = '', variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
