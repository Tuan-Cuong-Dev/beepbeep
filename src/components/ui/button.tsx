'use client';

import { ReactNode } from 'react';

type ButtonVariant =
  | 'default'
  | 'ghost'
  | 'outline'
  | 'secondary'
  | 'danger'
  | 'greenOutline'
  | 'destructive';

type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
}

export const Button = ({
  className = '',
  children,
  onClick,
  type = 'button',
  variant = 'default',
  size = 'md',
  disabled = false,
}: ButtonProps) => {

  const baseClass = 'inline-flex items-center justify-center font-semibold rounded-md transition-all';

  const sizeClass: Record<ButtonSize, string> = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClass: Record<ButtonVariant, string> = {
    default: 'bg-[#00d289] text-white border border-[#00d289] hover:bg-[#00b67a]',
    ghost: 'bg-transparent text-[#00d289] border border-transparent hover:bg-[#e6fff5]',
    outline: 'bg-white text-[#00d289] border border-[#00d289] hover:bg-[#f0fdf8]',
    secondary: 'bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200',
    danger: 'bg-red-500 text-white border border-red-500 hover:bg-red-600',
    greenOutline: 'bg-transparent text-[#00d289] border border-[#00d289] hover:bg-[#00d289]/10',
    destructive: 'bg-white text-red-600 border border-red-500 hover:bg-red-50',
  };

  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[
        baseClass,
        sizeClass[size],
        variantClass[variant],
        disabledClass,
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
};
