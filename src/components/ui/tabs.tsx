'use client';

import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/src/utils/cn';

// ------------------------ Variants ------------------------
const tabsVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full transition-all',
  {
    variants: {
      variant: {
        default:
          'border border-gray-300 text-gray-700 hover:bg-gray-100 data-[state=active]:bg-[#00d289] data-[state=active]:text-white',
      },
      size: {
        default: 'px-4 py-1 text-sm sm:text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// ------------------------ Tabs Wrapper ------------------------
interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={cn('w-full', className)}>
      {React.Children.map(children, (child) => {
        if (
          React.isValidElement(child) &&
          child.type === TabsTrigger // ✅ đảm bảo chỉ truyền activeValue cho TabsTrigger
        ) {
          const typedChild = child as React.ReactElement<TabsTriggerProps>;
          return React.cloneElement(typedChild, {
            activeValue: value,
            onClick: () => onValueChange(typedChild.props.value),
          });
        }
        return child;
      })}
    </div>
  );
}

// ------------------------ TabsList ------------------------
interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TabsList({ children, className, ...props }: TabsListProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-full bg-white p-2 shadow-sm overflow-x-auto',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ------------------------ TabsTrigger ------------------------
export interface TabsTriggerProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  value: string;
  activeValue?: string; // ✅ chỉ dùng nội bộ, không render ra DOM
}

export function TabsTrigger({
  value,
  activeValue,
  className,
  children,
  ...props
}: TabsTriggerProps) {
  const isActive = value === activeValue;

  return (
    <button
      type="button"
      data-state={isActive ? 'active' : 'inactive'}
      className={cn(
        tabsVariants({ variant: 'default', size: 'default' }),
        isActive && 'data-[state=active]:bg-[#00d289] data-[state=active]:text-white',
        className
      )}
      {...props} // ✅ activeValue không bị truyền xuống đây
    >
      {children}
    </button>
  );
}
