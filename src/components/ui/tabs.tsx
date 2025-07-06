'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva } from 'class-variance-authority';
import { cn } from '@/src/utils/cn';

// Styled Root component
const Tabs = TabsPrimitive.Root;

const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full border text-sm font-medium transition-all px-4 py-1',
  {
    variants: {
      variant: {
        default:
          'border-gray-300 text-gray-700 hover:bg-gray-100 data-[state=active]:bg-[#00d289] data-[state=active]:text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const TabsList = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn(
      'flex flex-wrap items-center gap-2 rounded-full bg-white p-2 shadow-sm overflow-x-auto',
      className
    )}
    {...props}
  />
);

const TabsTrigger = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger className={cn(tabsTriggerVariants(), className)} {...props} />
);

const TabsContent = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content className={cn('w-full mt-4', className)} {...props} />
);

export { Tabs, TabsList, TabsTrigger, TabsContent };
