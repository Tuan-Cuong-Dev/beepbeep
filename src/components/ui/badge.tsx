// badge.tsx
export function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
      <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${className}`}>
        {children}
      </span>
    );
  }
  