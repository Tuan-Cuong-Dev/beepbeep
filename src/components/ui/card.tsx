// Card Component
import { ReactNode } from 'react';

interface CardProps {
  className?: string;
  children: ReactNode;
}

export const Card = ({ className = '', children }: CardProps) => {
  return <div className={`bg-white rounded-xl shadow p-4 ${className}`}>{children}</div>;
};

export const CardContent = ({ className = '', children }: CardProps) => {
  return <div className={className}>{children}</div>;
};
