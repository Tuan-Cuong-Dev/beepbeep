// Chuẩn hóa việc chọn ngày toàn dự án Bíp Bíp

// Utils chuẩn hoá ngày cho toàn dự án theo yyyy-MM-dd

'use client';

import { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { parseYMD, fmtYMD } from '@/src/utils/dateYMD';
import { safeFormatDate } from '@/src/utils/safeFormatDate';

export type DateFieldProps = {
  id: string;
  label?: string;
  value: string;                 // yyyy-MM-dd
  onChange: (val: string) => void;
  min?: string;                  // yyyy-MM-dd
  max?: string;                  // yyyy-MM-dd
  placeholder?: string;          // default "YYYY-MM-DD"
  required?: boolean;
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;         // dd/MM/yyyy dưới input (default true)
  previewFormat?: string;        // default 'dd/MM/yyyy'
  size?: 'sm' | 'md';            // input chiều cao
};

export function DateField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  placeholder = 'YYYY-MM-DD',
  required,
  disabled,
  className = '',
  showPreview = true,
  previewFormat = 'dd/MM/yyyy',
  size = 'md',
}: DateFieldProps) {
  // Nút mở calendar (customInput cho DatePicker)
  const CalendarButton = forwardRef<HTMLButtonElement, React.ComponentProps<'button'>>(
    ({ onClick }, ref) => (
      <button
        type="button"
        ref={ref}
        onClick={onClick}
        className={`${
          size === 'sm' ? 'h-9' : 'h-10'
        } px-3 rounded-lg border bg-white text-sm hover:bg-gray-50 disabled:opacity-50`}
        aria-label={`Open ${label || id} calendar`}
        disabled={disabled}
      >
        📅
      </button>
    )
  );
  CalendarButton.displayName = 'CalendarButton';

  const selected = parseYMD(value);
  const minDate = min ? parseYMD(min) ?? undefined : undefined;
  const maxDate = max ? parseYMD(max) ?? undefined : undefined;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="flex items-center gap-2">
        {/* Ô nhập text: tap ở giữa vẫn gõ được trên mobile */}
        <input
          id={id}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            // chỉ cho số và dấu gạch, dài tối đa 10 ký tự
            const raw = e.target.value.replace(/[^\d-]/g, '').slice(0, 10);
            onChange(raw);
          }}
          required={required}
          disabled={disabled}
          className={`${
            size === 'sm' ? 'h-9' : 'h-10'
          } w-full rounded-lg border border-input bg-background px-3 text-sm
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                      disabled:cursor-not-allowed disabled:opacity-50`}
          aria-label={label || id}
        />

        {/* Nút mở lịch (react-datepicker hiển thị qua portal) */}
        <DatePicker
          selected={selected as Date | null}
          onChange={(d) => onChange(fmtYMD(d as Date))}
          minDate={minDate}
          maxDate={maxDate}
          customInput={<CalendarButton />}
          withPortal
        />
      </div>

      {showPreview && (
        <p className="mt-1 text-xs text-gray-500">
          {safeFormatDate(value, previewFormat)}
        </p>
      )}
    </div>
  );
}
