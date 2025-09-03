'use client';

import React, { forwardRef, ReactNode } from 'react';
import { Slot } from '@radix-ui/react-slot';

// Simple className merge (keeps last value wins for Tailwind duplicates)
function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export type ButtonVariant =
  | 'default'
  | 'ghost'
  | 'outline'
  | 'secondary'
  | 'danger'
  | 'greenOutline'
  | 'destructive'
  | 'success';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'type'> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean; // use parent element instead of <button>
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** Chỉ dùng khi asChild=false. Mặc định 'button' để tránh submit form ngoài ý muốn */
  type?: 'button' | 'submit' | 'reset';
  /** Disabled logic thống nhất cho cả hai chế độ */
  disabled?: boolean;
}

const baseClass =
  'inline-flex items-center justify-center font-semibold rounded-md transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00d289] disabled:cursor-not-allowed disabled:opacity-50';

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
};

const variantClass: Record<ButtonVariant, string> = {
  default: 'bg-[#00d289] text-white border border-[#00d289] hover:bg-[#00b67a] active:translate-y-[1px]',
  ghost: 'bg-transparent text-[#00d289] border border-transparent hover:bg-[#e6fff5] active:translate-y-[1px]',
  outline: 'bg-white text-[#00d289] border border-[#00d289] hover:bg-[#f0fdf8] active:translate-y-[1px]',
  secondary: 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200 active:translate-y-[1px]',
  danger: 'bg-red-500 text-white border border-red-500 hover:bg-red-600 active:translate-y-[1px]',
  greenOutline: 'bg-transparent text-[#00d289] border border-[#00d289] hover:bg-[#00d289]/10 active:translate-y-[1px]',
  destructive: 'bg-white text-red-600 border border-red-500 hover:bg-red-50 active:translate-y-[1px]',
  success: 'bg-green-600 text-white border border-green-600 hover:bg-green-700 active:translate-y-[1px]',
};

// Minimal spinner for loading state
const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    children,
    type = 'button',
    variant = 'default',
    size = 'md',
    disabled,
    asChild = false,
    fullWidth = false,
    loading = false,
    leftIcon,
    rightIcon,
    ...rest
  },
  ref
) {
  const Comp: any = asChild ? Slot : 'button';
  const isDisabled = Boolean(disabled || loading);

  // Nội dung, đảm bảo spacing đẹp khi có/không có icon & loading
  const content = (
    <>
      {loading ? <Spinner /> : leftIcon}
      <span className="inline-flex items-center">{children}</span>
      {!loading && rightIcon}
    </>
  );

  // Props chung cho cả hai chế độ
  const commonProps = {
    'aria-disabled': isDisabled || undefined,
    'aria-busy': loading || undefined,
    'data-variant': variant,
    'data-size': size,
    className: cn(
      baseClass,
      sizeClass[size],
      variantClass[variant],
      fullWidth && 'w-full',
      loading && 'cursor-wait',
      // Khi asChild, không có thuộc tính disabled hợp lệ -> dùng lớp & aria để khoá tương tác
      asChild && isDisabled && 'pointer-events-none opacity-50',
      className
    ),
    ...rest,
  };

  // Tránh truyền type/disabled vào Fragment/Slot/child
  return asChild ? (
    <Comp {...commonProps}>{content}</Comp>
  ) : (
    <Comp
      ref={ref}
      type={type}
      disabled={isDisabled}
      {...commonProps}
    >
      {content}
    </Comp>
  );
});

export default Button;
