import * as React from "react";
import { cn } from "@/src/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00d289] focus:border-transparent",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
