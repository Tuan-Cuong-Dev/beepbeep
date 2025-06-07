'use client';

import * as React from 'react';

type CheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
};

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onCheckedChange,
  className = '',
  disabled = false,
}) => {
  return (
    <input
      type="checkbox"
      className={`w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-[#00d289] ${className}`}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      disabled={disabled}
    />
  );
};
