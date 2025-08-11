'use client';

import { ReactNode, useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('common');

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-haspopup="listbox"
      aria-expanded={!disabled}
      className={`w-full text-left px-3 py-2 border rounded text-base bg-white appearance-none
        ${disabled ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-900 cursor-pointer'}
        ${className}`}
    >
      {value || placeholder || t('simple_select.select', 'Chọn...')}
    </button>
  );
};

export const SelectContent = ({
  className = '',
  children,
  open,
  maxMenuHeight = 240, // px
}: {
  className?: string;
  children: ReactNode;
  open: boolean;
  maxMenuHeight?: number;
}) => {
  if (!open) return null;
  return (
    <div
      className={`absolute z-10 mt-2 w-full bg-white rounded border shadow-sm ${className}`}
      role="listbox"
    >
      {/* Vùng cuộn */}
      <div style={{ maxHeight: maxMenuHeight, overflowY: 'auto' }}>
        {children}
      </div>
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
  placeholder,
  value,
  onChange,
  className,
  disabled = false,
  maxVisible = 10,       // Số item hiển thị tối đa
  maxMenuHeight = 240,   // Chiều cao tối đa dropdown (px)
}: {
  options: { label: string; value: string }[];
  placeholder?: string;
  value?: string;
  onChange: (val: string) => void;
  className?: string;
  disabled?: boolean;
  maxVisible?: number;
  maxMenuHeight?: number;
}) => {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const selectedLabel = selectedOption?.label;

  // Giới hạn số item hiển thị
  const visibleOptions = useMemo(
    () => options.slice(0, Math.max(0, maxVisible)),
    [options, maxVisible]
  );

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
    <div className={`relative w-full ${className || ''}`} ref={wrapperRef}>
      <SelectTrigger
        value={selectedLabel}
        placeholder={placeholder || t('simple_select.select', 'Chọn...')}
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
      />
      <SelectContent open={open} maxMenuHeight={maxMenuHeight}>
        {visibleOptions.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            onSelect={(val) => {
              onChange(val);
              setOpen(false);
            }}
          >
            {opt.label}
          </SelectItem>
        ))}

        {options.length > maxVisible && (
          <div className="border-t text-xs text-gray-500 px-3 py-2">
            {t('simple_select.showing', {
              count: maxVisible,
              total: options.length,
              defaultValue: `Hiển thị ${maxVisible}/${options.length}. Vui lòng tìm kiếm để thu hẹp kết quả.`,
            })}
          </div>
        )}
      </SelectContent>
    </div>
  );
};
