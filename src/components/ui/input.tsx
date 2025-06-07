import { ReactNode, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  icon?: ReactNode;
}

export const Input = ({ className = '', icon, ...props }: InputProps) => {
  return (
    <div className={`flex items-center border border-[#00d289] rounded-sm p-2 ${className}`}>
      {icon && <span className="mr-2">{icon}</span>}
      <input
        className="flex-1 outline-none bg-transparent"
        {...props}
      />
    </div>
  );
};
