'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';

interface SelectItemProps {
  value: string;
  children: ReactNode;
  onSelect: (value: string, label: string) => void;
}

export const SelectTrigger = ({
  className = '',
  value,
  placeholder,
  onClick,
  disabled = false,
}: {
  className?: string;
  value?: string;
  placeholder?: string;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full text-left px-3 py-2 border rounded text-base bg-white appearance-none
        ${disabled ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-900 cursor-pointer'} 
        ${className}`}
    >
      {value || placeholder || 'Select...'}
    </button>
  );
};

export const SelectContent = ({
  className = '',
  children,
  open,
}: {
  className?: string;
  children: ReactNode;
  open: boolean;
}) => {
  if (!open) return null;
  return (
    <div className={`absolute z-10 mt-2 w-full bg-white rounded border shadow-sm ${className}`}>
      {children}
    </div>
  );
};

export const SelectItem = ({ value, children, onSelect }: SelectItemProps) => {
  return (
    <div
      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
      onClick={() => onSelect(value, children?.toString() || '')}
      role="option"
    >
      {children}
    </div>
  );
};

export const SimpleSelect = ({
  options,
  placeholder = 'Select...',
  value,
  onChange,
  className,
  disabled = false,
}: {
  options: { label: string; value: string }[];
  placeholder?: string;
  value?: string;
  onChange: (val: string) => void;
  className?: string;
  disabled?: boolean; // ✅ THÊM prop mới
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const selectedLabel = selectedOption?.label;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative w-full ${className}`} ref={wrapperRef}>
      <SelectTrigger
        value={selectedLabel}
        placeholder={placeholder}
        onClick={() => setOpen(!open)}
        disabled={disabled} // ✅ TRUYỀN disabled vào
      />
      <SelectContent open={open}>
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            onSelect={(val, label) => {
              onChange(val);
              setOpen(false);
            }}
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </div>
  );
};
