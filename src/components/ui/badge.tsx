/**
 * Badge component (rounded label), used in tables, status indicators, etc.
 *
 * ✅ Compatible with Next.js / CRA (no need for special module config)
 * ✅ Variants + Sizes
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
  | 'outline'

/** Sizes */
type BadgeSize = 'sm' | 'md' | 'lg'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
  className?: string
  variant?: BadgeVariant
  size?: BadgeSize
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-200 text-gray-800',
  success: 'bg-green-100 text-green-800',
  destructive: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  secondary: 'bg-gray-100 text-gray-600',
  brand: 'bg-[#00d289] text-white', // ✅ màu thương hiệu Bíp Bíp
  outline: 'border border-gray-300 text-gray-700 bg-transparent',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
  lg: 'px-3 py-1 text-base',
}

export function Badge({
  children,
  className = '',
  variant = 'default',
  size = 'sm',
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-semibold whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
